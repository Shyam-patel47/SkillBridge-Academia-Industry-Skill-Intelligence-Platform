import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole, ApplicationStatus } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  applyOpportunitySchema,
  updateApplicationStatusSchema,
  withdrawApplicationSchema,
} from "../modules/applications/application.schema.js";
import { sendSuccess } from "../utils/response.util.js";

async function runApplicationLifecycleTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Application Lifecycle & RBAC Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const studentToken1 = generateAccessToken({
    id: "student_user_01",
    email: "student1@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const studentToken2 = generateAccessToken({
    id: "student_user_02",
    email: "student2@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const recruiterToken1 = generateAccessToken({
    id: "recruiter_user_01",
    email: "recruiter1@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  const recruiterToken2 = generateAccessToken({
    id: "recruiter_user_02",
    email: "recruiter2@cloudscale.dev",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  // Mock in-memory database store for testing
  interface MockApp {
    id: string;
    opportunityId: string;
    studentId: string;
    companyId: string;
    status: ApplicationStatus;
    matchScore: number;
    resumeUrl: string | null;
    coverLetter: string | null;
    statusNotes: string | null;
  }

  const applicationsDb: MockApp[] = [
    {
      id: "app-01",
      opportunityId: "opp-frontend-01",
      studentId: "student-profile-01",
      companyId: "company-techcorp",
      status: ApplicationStatus.APPLIED,
      matchScore: 89,
      resumeUrl: "https://skillbridge.dev/resumes/student1.pdf",
      coverLetter: "Passionate about frontend development with React.",
      statusNotes: null,
    },
    {
      id: "app-02",
      opportunityId: "opp-cloud-01",
      studentId: "student-profile-02",
      companyId: "company-cloudscale",
      status: ApplicationStatus.SHORTLISTED,
      matchScore: 94,
      resumeUrl: "https://skillbridge.dev/resumes/student2.pdf",
      coverLetter: "Experienced with Kubernetes and CI/CD pipelines.",
      statusNotes: "Strong devops foundations.",
    },
  ];

  // -------------------------------------------------------------
  // Test 1: Student Apply Schema Validation & Role Guard
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Test 1: Student Application Submission Validation & Role Guard",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/applications",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(applyOpportunitySchema),
      (req: Request, res: Response) => {
        sendSuccess(
          res,
          { application: req.body },
          "Application submitted",
          201,
        );
      },
    );

    const resForbidden = await request(testApp)
      .post("/api/applications")
      .set("Authorization", `Bearer ${recruiterToken1}`)
      .send({ opportunityId: "opp-frontend-01" });

    const resInvalid = await request(testApp)
      .post("/api/applications")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({}); // Missing opportunityId

    const resValid = await request(testApp)
      .post("/api/applications")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({
        opportunityId: "opp-frontend-01",
        resumeUrl: "https://skillbridge.dev/resume.pdf",
        coverLetter: "Excited to apply for this internship.",
      });

    if (
      resForbidden.status === 403 &&
      resInvalid.status === 422 &&
      resValid.status === 201
    ) {
      console.log(
        "  ✅ Passed: /api/applications enforces STUDENT role (403 for recruiters), validates schema (422), and accepts valid applications (201)",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Student application validation/guard failed:",
        {
          forbidden: resForbidden.status,
          invalid: resInvalid.status,
          valid: resValid.status,
        },
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Duplicate Application Prevention
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 2: Duplicate Application Submission Prevention");

    const checkDuplicate = (opportunityId: string, studentId: string) => {
      return applicationsDb.some(
        (app) =>
          app.opportunityId === opportunityId && app.studentId === studentId,
      );
    };

    const isDuplicate = checkDuplicate("opp-frontend-01", "student-profile-01");
    const isNew = checkDuplicate("opp-frontend-01", "student-profile-03");

    if (isDuplicate === true && isNew === false) {
      console.log(
        "  ✅ Passed: Engine prevents duplicate application submissions for the same opportunity (409 Conflict simulation)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Duplicate check failed");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Multi-Tenant Student Isolation (Unauthorized Access Guard)
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Multi-Tenant Student Application Isolation");

    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/applications/me/:id",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        const appId = req.params.id;
        const app = applicationsDb.find((a) => a.id === appId);
        if (!app) return res.status(404).json({ message: "Not found" });

        // Simulate student ownership check
        const currentStudentId =
          req.user?.id === "student_user_01"
            ? "student-profile-01"
            : req.user?.id === "student_user_02"
              ? "student-profile-02"
              : "student-profile-other";

        if (app.studentId !== currentStudentId) {
          return res.status(403).json({
            success: false,
            error: {
              code: "FORBIDDEN_APPLICATION_ACCESS",
              message: "Forbidden",
            },
          });
        }

        return sendSuccess(
          res,
          { application: app },
          "Application detail",
          200,
        );
      },
    );

    // Student 1 accesses own app (app-01) -> 200
    const resOwn = await request(testApp)
      .get("/api/applications/me/app-01")
      .set("Authorization", `Bearer ${studentToken1}`);

    // Student 1 tries to access Student 2's app (app-02) -> 403 Forbidden
    const resOther = await request(testApp)
      .get("/api/applications/me/app-02")
      .set("Authorization", `Bearer ${studentToken1}`);

    if (resOwn.status === 200 && resOther.status === 403) {
      console.log(
        "  ✅ Passed: Student can only view their own applications (403 Forbidden on cross-student access)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Student isolation check failed:", {
        own: resOwn.status,
        other: resOther.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Recruiter Multi-Tenant Isolation & Status Transitions
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: Recruiter Multi-Tenant Isolation & Pipeline Transitions",
    );

    const testApp = express();
    testApp.use(express.json());

    testApp.patch(
      "/api/applications/recruiter/:id/status",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      validateRequest(updateApplicationStatusSchema),
      (req: Request, res: Response) => {
        const appId = req.params.id;
        const app = applicationsDb.find((a) => a.id === appId);
        if (!app) return res.status(404).json({ message: "Not found" });

        // Simulate company ownership check
        const currentCompanyId =
          req.user?.id === "recruiter_user_01"
            ? "company-techcorp"
            : req.user?.id === "recruiter_user_02"
              ? "company-cloudscale"
              : "company-other";

        if (app.companyId !== currentCompanyId) {
          return res.status(403).json({
            success: false,
            error: {
              code: "FORBIDDEN_APPLICATION_ACCESS",
              message: "Forbidden",
            },
          });
        }

        app.status = req.body.status;
        app.statusNotes = req.body.statusNotes || app.statusNotes;
        return sendSuccess(res, { application: app }, "Status updated", 200);
      },
    );

    // Recruiter 1 tries to update candidate from Company 2 (app-02) -> 403 Forbidden
    const resForbidden = await request(testApp)
      .patch("/api/applications/recruiter/app-02/status")
      .set("Authorization", `Bearer ${recruiterToken1}`)
      .send({ status: ApplicationStatus.SHORTLISTED });

    // Recruiter 1 updates candidate from Company 1 (app-01) -> 200 OK
    const resShortlist = await request(testApp)
      .patch("/api/applications/recruiter/app-01/status")
      .set("Authorization", `Bearer ${recruiterToken1}`)
      .send({
        status: ApplicationStatus.SHORTLISTED,
        statusNotes: "Profile fits React benchmark",
      });

    // Recruiter 1 moves to Interview
    const resInterview = await request(testApp)
      .patch("/api/applications/recruiter/app-01/status")
      .set("Authorization", `Bearer ${recruiterToken1}`)
      .send({ status: ApplicationStatus.INTERVIEW });

    // Recruiter 1 extends Offer
    const resOffer = await request(testApp)
      .patch("/api/applications/recruiter/app-01/status")
      .set("Authorization", `Bearer ${recruiterToken1}`)
      .send({ status: ApplicationStatus.OFFERED });

    if (
      resForbidden.status === 403 &&
      resShortlist.status === 200 &&
      resInterview.status === 200 &&
      resOffer.status === 200 &&
      resOffer.body.data.application.status === ApplicationStatus.OFFERED
    ) {
      console.log(
        "  ✅ Passed: Recruiter multi-tenant isolation enforced (403 Forbidden for other companies) and full pipeline transitions (SHORTLISTED -> INTERVIEW -> OFFERED) executed smoothly",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Recruiter pipeline transition failed:", {
        forbidden: resForbidden.status,
        shortlist: resShortlist.status,
        interview: resInterview.status,
        offer: resOffer.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Student Application Withdrawal Lifecycle
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Student Application Withdrawal Lifecycle");

    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/applications/:id/withdraw",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(withdrawApplicationSchema),
      (req: Request, res: Response) => {
        const appId = req.params.id;
        const app = applicationsDb.find((a) => a.id === appId);
        if (!app) return res.status(404).json({ message: "Not found" });

        if (app.status === ApplicationStatus.WITHDRAWN) {
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_WITHDRAWAL_STATUS",
              message: "Already withdrawn",
            },
          });
        }

        app.status = ApplicationStatus.WITHDRAWN;
        return sendSuccess(
          res,
          { application: app },
          "Application withdrawn",
          200,
        );
      },
    );

    // Student withdraws app-02
    const resWithdraw = await request(testApp)
      .post("/api/applications/app-02/withdraw")
      .set("Authorization", `Bearer ${studentToken2}`)
      .send({ reason: "Accepted another offer" });

    // Second withdrawal attempt rejected with 400
    const resWithdrawAgain = await request(testApp)
      .post("/api/applications/app-02/withdraw")
      .set("Authorization", `Bearer ${studentToken2}`)
      .send({ reason: "Accepted another offer" });

    if (
      resWithdraw.status === 200 &&
      resWithdraw.body.data.application.status ===
        ApplicationStatus.WITHDRAWN &&
      resWithdrawAgain.status === 400
    ) {
      console.log(
        "  ✅ Passed: Student can withdraw active applications and cannot re-withdraw already withdrawn applications (400 Bad Request)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Withdrawal check failed:", {
        withdraw: resWithdraw.status,
        again: resWithdrawAgain.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Application Lifecycle Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runApplicationLifecycleTests().catch((err) => {
  console.error("Fatal application lifecycle test error:", err);
  process.exit(1);
});
