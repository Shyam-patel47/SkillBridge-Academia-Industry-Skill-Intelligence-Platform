import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole, OpportunityType, WorkMode } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { updateCompanyProfileSchema } from "../modules/companies/company.schema.js";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  togglePublishSchema,
} from "../modules/opportunities/opportunity.schema.js";
import { sendSuccess } from "../utils/response.util.js";

async function runCompanyOpportunityTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Industry & Opportunity Module Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const recruiterToken = generateAccessToken({
    id: "recruiter_test_uid_01",
    email: "recruiter@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  const otherRecruiterToken = generateAccessToken({
    id: "recruiter_test_uid_02",
    email: "hr@innovate.ai",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  const studentToken = generateAccessToken({
    id: "student_test_uid_01",
    email: "student@campus.edu",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  // -------------------------------------------------------------
  // Test 1: Company Profile RBAC & Payload Validation
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Company Profile RBAC Guard & Validation");
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/companies/me",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      (_req: Request, res: Response) => {
        sendSuccess(
          res,
          { company: { companyName: "TechCorp Solutions" } },
          "Profile retrieved",
          200,
        );
      },
    );

    testApp.put(
      "/api/companies/me",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY),
      validateRequest(updateCompanyProfileSchema),
      (req: Request, res: Response) => {
        sendSuccess(res, { company: req.body }, "Profile updated", 200);
      },
    );

    // 1A: Student forbidden
    const resForbidden = await request(testApp)
      .get("/api/companies/me")
      .set("Authorization", `Bearer ${studentToken}`);

    // 1B: Recruiter authorized
    const resAuthorized = await request(testApp)
      .get("/api/companies/me")
      .set("Authorization", `Bearer ${recruiterToken}`);

    // 1C: Invalid website URL -> 422
    const resInvalidWebsite = await request(testApp)
      .put("/api/companies/me")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ website: "invalid-url-not-http" });

    // 1D: Valid update
    const resValidUpdate = await request(testApp)
      .put("/api/companies/me")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        companyName: "TechCorp Enterprise",
        website: "https://techcorp.io",
        industry: "Cloud Infrastructure",
      });

    if (
      resForbidden.status === 403 &&
      resAuthorized.status === 200 &&
      resInvalidWebsite.status === 422 &&
      resValidUpdate.status === 200
    ) {
      console.log(
        "  ✅ Passed: Company profile route enforces INDUSTRY role (403 for students) and validates schema",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Company profile RBAC test failed:", {
        forbidden: resForbidden.status,
        authorized: resAuthorized.status,
        invalidWebsite: resInvalidWebsite.status,
        validUpdate: resValidUpdate.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Opportunity Creation & Required Skills Validation
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Opportunity Creation & Required Skills Schema Validation",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/opportunities",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      validateRequest(createOpportunitySchema),
      (req: Request, res: Response) => {
        sendSuccess(res, { opportunity: req.body }, "Opportunity created", 201);
      },
    );

    // 2A: Valid Opportunity payload
    const resValidOpp = await request(testApp)
      .post("/api/opportunities")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        title: "Full Stack Engineering Intern",
        type: OpportunityType.INTERNSHIP,
        description:
          "Join our high-velocity team building scalable microservices and modern React applications.",
        workMode: WorkMode.HYBRID,
        location: "Bengaluru, India",
        duration: "6 Months",
        stipendSalary: "₹40,000 / month",
        minCgpa: 7.5,
        eligibleBranches: ["CSE", "IT", "ECE"],
        eligibleGradYears: [2025, 2026],
        requiredSkills: [
          {
            skillId: "sk_react",
            minScore: 75.0,
            isMandatory: true,
            weight: 1.5,
          },
          {
            skillId: "sk_node",
            minScore: 70.0,
            isMandatory: true,
            weight: 1.2,
          },
        ],
      });

    // 2B: Invalid: Missing requiredSkills (empty array) -> 422
    const resEmptySkills = await request(testApp)
      .post("/api/opportunities")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        title: "Frontend Intern",
        description:
          "Short description that satisfies length criteria but misses required skills.",
        requiredSkills: [],
      });

    // 2C: Invalid: Description too short (<20 chars) -> 422
    const resShortDesc = await request(testApp)
      .post("/api/opportunities")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        title: "Backend Intern",
        description: "Too short",
        requiredSkills: [{ skillId: "sk_node", minScore: 60 }],
      });

    if (
      resValidOpp.status === 201 &&
      resEmptySkills.status === 422 &&
      resShortDesc.status === 422
    ) {
      console.log(
        "  ✅ Passed: Opportunity creation requires valid skills benchmark matrix, description length, and rejects empty curricula (422)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Opportunity creation schema test failed:", {
        valid: resValidOpp.status,
        emptySkills: resEmptySkills.status,
        shortDesc: resShortDesc.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Multi-tenant Ownership & Publish Toggle Security
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 3: Multi-Tenant Ownership & Status Toggle Authorization",
    );
    const testApp = express();
    testApp.use(express.json());

    const mockOpportunities = new Map<
      string,
      { id: string; companyId: string; isActive: boolean }
    >([
      [
        "opp_101",
        { id: "opp_101", companyId: "comp_recruiter_01", isActive: true },
      ],
    ]);

    testApp.patch(
      "/api/opportunities/:id/publish",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      validateRequest(togglePublishSchema),
      (req: Request, res: Response) => {
        const id = req.params.id as string;
        const opp = mockOpportunities.get(id);
        if (!opp)
          return res.status(404).json({ success: false, message: "Not found" });

        // Simulate multi-tenant ownership check
        const userCompanyId =
          req.user?.id === "recruiter_test_uid_01"
            ? "comp_recruiter_01"
            : "comp_recruiter_02";
        if (opp.companyId !== userCompanyId) {
          return res.status(403).json({ success: false, message: "Forbidden" });
        }

        opp.isActive = req.body.isActive;
        return sendSuccess(res, { opportunity: opp }, "Status updated", 200);
      },
    );

    // 3A: Company A toggles own opportunity -> 200 OK
    const resOwnerPublish = await request(testApp)
      .patch("/api/opportunities/opp_101/publish")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ isActive: false });

    // 3B: Company B attempts to modify Company A's posting -> 403 Forbidden
    const resOtherCompanyForbidden = await request(testApp)
      .patch("/api/opportunities/opp_101/publish")
      .set("Authorization", `Bearer ${otherRecruiterToken}`)
      .send({ isActive: false });

    if (
      resOwnerPublish.status === 200 &&
      resOwnerPublish.body.data.opportunity.isActive === false &&
      resOtherCompanyForbidden.status === 403
    ) {
      console.log(
        "  ✅ Passed: Multi-tenant ownership prevents cross-company posting modification (403 Forbidden for unauthorized companies)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Ownership security test failed:", {
        owner: resOwnerPublish.body,
        crossCompany: resOtherCompanyForbidden.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Industry & Opportunity Module Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCompanyOpportunityTests().catch((err) => {
  console.error("Fatal company opportunity test error:", err);
  process.exit(1);
});
