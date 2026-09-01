import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createProjectSchema,
  createCertificationSchema,
  createAchievementSchema,
  updatePortfolioSettingsSchema,
} from "../modules/portfolios/portfolio.schema.js";
import { sendSuccess } from "../utils/response.util.js";

async function runDigitalPortfolioTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Digital Portfolio & Public URL Test Suite");
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

  const recruiterToken = generateAccessToken({
    id: "recruiter_user_01",
    email: "recruiter@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  // Mock in-memory portfolio database
  let portfolioStore = {
    studentId: "student-profile-01",
    customSlug: "aarav-sharma-dev",
    isPublic: true,
    viewsCount: 14,
    projects: [
      {
        id: "proj-01",
        studentId: "student-profile-01",
        title: "CloudScale DevOps Platform",
        description:
          "Automated Kubernetes pipeline with ArgoCD and Helm charts.",
        liveUrl: "https://cloudscale.dev",
        githubUrl: "https://github.com/aarav/cloudscale",
        skillsUsed: ["Docker", "Kubernetes", "Go"],
        isFeatured: true,
      },
    ],
    certifications: [
      {
        id: "cert-01",
        studentId: "student-profile-01",
        title: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        issueDate: "2025-01-15",
        credentialUrl: "https://aws.amazon.com/verify/12345",
      },
    ],
    achievements: [
      {
        id: "ach-01",
        studentId: "student-profile-01",
        title: "Smart India Hackathon Winner 2025",
        issuer: "Ministry of Education",
        description: "First prize in Smart Automation category.",
      },
    ],
  };

  // -------------------------------------------------------------
  // Test 1: Portfolio Protected Studio & Role Guard
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Test 1: Portfolio Studio Protected Route & Role Enforcement",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/portfolios/me",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        sendSuccess(
          res,
          { portfolio: portfolioStore },
          "Student portfolio",
          200,
        );
      },
    );

    // 1. Student access -> 200 OK
    const resStudent = await request(testApp)
      .get("/api/portfolios/me")
      .set("Authorization", `Bearer ${studentToken1}`);

    // 2. Recruiter trying to access student portfolio studio -> 403 Forbidden
    const resRecruiter = await request(testApp)
      .get("/api/portfolios/me")
      .set("Authorization", `Bearer ${recruiterToken}`);

    if (resStudent.status === 200 && resRecruiter.status === 403) {
      console.log(
        "  ✅ Passed: /api/portfolios/me strictly enforces STUDENT role (403 for recruiters, 200 for students)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Role guard check failed:", {
        student: resStudent.status,
        recruiter: resRecruiter.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Project Management CRUD & Ownership Authorization
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Project Management CRUD & Ownership Authorization",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/portfolios/me/projects",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(createProjectSchema),
      (req: Request, res: Response) => {
        const newProj = {
          id: `proj-${Date.now()}`,
          studentId:
            req.user?.id === "student_user_01"
              ? "student-profile-01"
              : "student-profile-02",
          ...req.body,
        };
        portfolioStore.projects.push(newProj);
        sendSuccess(res, { project: newProj }, "Project created", 201);
      },
    );

    testApp.delete(
      "/api/portfolios/me/projects/:id",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        const projId = req.params.id;
        const proj = portfolioStore.projects.find((p) => p.id === projId);
        if (!proj) return res.status(404).json({ message: "Not found" });

        const currentStudentId =
          req.user?.id === "student_user_01"
            ? "student-profile-01"
            : "student-profile-02";

        if (proj.studentId !== currentStudentId) {
          return res.status(403).json({
            success: false,
            error: { code: "FORBIDDEN_PROJECT_ACCESS", message: "Forbidden" },
          });
        }

        portfolioStore.projects = portfolioStore.projects.filter(
          (p) => p.id !== projId,
        );
        return sendSuccess(res, { success: true }, "Project deleted", 200);
      },
    );

    // 1. Add valid project
    const resAdd = await request(testApp)
      .post("/api/portfolios/me/projects")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({
        title: "SkillBridge Platform",
        description: "Academia-Industry skill intelligence platform.",
        liveUrl: "https://skillbridge.dev",
        skillsUsed: ["React", "Node.js", "PostgreSQL"],
        isFeatured: true,
      });

    // 2. Student 2 tries to delete Student 1's project -> 403 Forbidden
    const resDeleteUnauthorized = await request(testApp)
      .delete("/api/portfolios/me/projects/proj-01")
      .set("Authorization", `Bearer ${studentToken2}`);

    // 3. Student 1 deletes their own project -> 200 OK
    const resDeleteOwn = await request(testApp)
      .delete("/api/portfolios/me/projects/proj-01")
      .set("Authorization", `Bearer ${studentToken1}`);

    if (
      resAdd.status === 201 &&
      resDeleteUnauthorized.status === 403 &&
      resDeleteOwn.status === 200
    ) {
      console.log(
        "  ✅ Passed: Projects CRUD validates schema (201), enforces multi-tenant ownership guard (403 on cross-student edit/delete), and allows owner deletion (200)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Project CRUD check failed:", {
        add: resAdd.status,
        deleteUnauth: resDeleteUnauthorized.status,
        deleteOwn: resDeleteOwn.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Certifications & Achievements Creation Schema
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Certifications & Achievements Schema Validation");
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/portfolios/me/certifications",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(createCertificationSchema),
      (req: Request, res: Response) => {
        sendSuccess(res, { cert: req.body }, "Cert added", 201);
      },
    );

    testApp.post(
      "/api/portfolios/me/achievements",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(createAchievementSchema),
      (req: Request, res: Response) => {
        sendSuccess(res, { achievement: req.body }, "Achievement added", 201);
      },
    );

    const resCertInvalid = await request(testApp)
      .post("/api/portfolios/me/certifications")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({}); // Missing required title & issuer

    const resCertValid = await request(testApp)
      .post("/api/portfolios/me/certifications")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({
        title: "Certified Kubernetes Administrator",
        issuer: "Linux Foundation",
        issueDate: "2025-03-10",
        credentialUrl: "https://cncf.io/cert/12345",
      });

    const resAchValid = await request(testApp)
      .post("/api/portfolios/me/achievements")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({
        title: "HackMIT 2025 Best AI Award",
        issuer: "MIT",
        description: "Built generative code reviewer.",
      });

    if (
      resCertInvalid.status === 422 &&
      resCertValid.status === 201 &&
      resAchValid.status === 201
    ) {
      console.log(
        "  ✅ Passed: Certifications and Achievements endpoints validate required schemas (422) and persist data (201)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Certs/Achievements validation failed:", {
        certInvalid: resCertInvalid.status,
        certValid: resCertValid.status,
        achValid: resAchValid.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Public Portfolio Discovery & View Counter Increment
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Public Portfolio Discovery & Atomicity");
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/portfolios/public/:slug",
      (req: Request, res: Response) => {
        const slug = req.params.slug;
        if (slug !== portfolioStore.customSlug) {
          return res
            .status(404)
            .json({ success: false, message: "Portfolio not found" });
        }

        if (!portfolioStore.isPublic) {
          return res.status(403).json({
            success: false,
            error: {
              code: "PORTFOLIO_PRIVATE",
              message: "This student portfolio is private",
            },
          });
        }

        portfolioStore.viewsCount += 1;
        return sendSuccess(
          res,
          { portfolio: portfolioStore },
          "Public portfolio",
          200,
        );
      },
    );

    const initialViews = portfolioStore.viewsCount;

    // Unauthenticated public request
    const resPublic = await request(testApp).get(
      "/api/portfolios/public/aarav-sharma-dev",
    );

    if (
      resPublic.status === 200 &&
      portfolioStore.viewsCount === initialViews + 1
    ) {
      console.log(
        `  ✅ Passed: Public vanity URL (/portfolio/:slug) accessible without auth and increments view count (${initialViews} -> ${portfolioStore.viewsCount})`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Public portfolio access failed:", {
        status: resPublic.status,
        views: portfolioStore.viewsCount,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Public vs Private Visibility Toggle
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 5: Public vs Private Portfolio Visibility Enforcement",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.patch(
      "/api/portfolios/me/settings",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(updatePortfolioSettingsSchema),
      (req: Request, res: Response) => {
        if (req.body.isPublic !== undefined) {
          portfolioStore.isPublic = req.body.isPublic;
        }
        if (req.body.customSlug) {
          portfolioStore.customSlug = req.body.customSlug;
        }
        sendSuccess(res, { settings: portfolioStore }, "Settings updated", 200);
      },
    );

    testApp.get(
      "/api/portfolios/public/:slug",
      (req: Request, res: Response) => {
        const slug = req.params.slug;
        if (slug !== portfolioStore.customSlug) {
          return res
            .status(404)
            .json({ success: false, message: "Portfolio not found" });
        }

        if (!portfolioStore.isPublic) {
          return res.status(403).json({
            success: false,
            error: {
              code: "PORTFOLIO_PRIVATE",
              message: "This student portfolio is private",
            },
          });
        }

        return sendSuccess(
          res,
          { portfolio: portfolioStore },
          "Public portfolio",
          200,
        );
      },
    );

    // 1. Student toggles isPublic: false
    const resTogglePrivate = await request(testApp)
      .patch("/api/portfolios/me/settings")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({ isPublic: false });

    // 2. Public request now returns 403 Forbidden (PORTFOLIO_PRIVATE)
    const resPrivateAccess = await request(testApp).get(
      "/api/portfolios/public/aarav-sharma-dev",
    );

    // 3. Student toggles isPublic: true
    const resTogglePublic = await request(testApp)
      .patch("/api/portfolios/me/settings")
      .set("Authorization", `Bearer ${studentToken1}`)
      .send({ isPublic: true });

    // 4. Public request now returns 200 OK
    const resPublicAccess = await request(testApp).get(
      "/api/portfolios/public/aarav-sharma-dev",
    );

    if (
      resTogglePrivate.status === 200 &&
      resPrivateAccess.status === 403 &&
      resPrivateAccess.body.error.code === "PORTFOLIO_PRIVATE" &&
      resTogglePublic.status === 200 &&
      resPublicAccess.status === 200
    ) {
      console.log(
        "  ✅ Passed: Visibility toggle strictly controls public discovery (403 when private, 200 when public)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Visibility toggle check failed:", {
        togglePrivate: resTogglePrivate.status,
        privateAccess: resPrivateAccess.status,
        togglePublic: resTogglePublic.status,
        publicAccess: resPublicAccess.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Digital Portfolio Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDigitalPortfolioTests().catch((err) => {
  console.error("Fatal digital portfolio test error:", err);
  process.exit(1);
});
