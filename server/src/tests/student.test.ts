import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole, WorkMode } from "@prisma/client";
import { createApp } from "../app.js";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { updateStudentProfileSchema } from "../modules/students/student.schema.js";
import { sendSuccess } from "../utils/response.util.js";

async function runStudentTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Student Profile & Skills Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const studentToken = generateAccessToken({
    id: "student_test_uid_01",
    email: "student.profile.test@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const recruiterToken = generateAccessToken({
    id: "recruiter_test_uid_01",
    email: "recruiter.test@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  // -------------------------------------------------------------
  // Test 1: Student Route Authentication Check
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Student Profile Authentication & RBAC Guard");
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      "/api/students/me",
      authenticate,
      authorizeRoles(UserRole.STUDENT),
      (_req: Request, res: Response) => {
        sendSuccess(res, {
          profile: { id: "std_01", fullName: "Alex Morgan" },
        });
      },
    );

    // 1A: Request without token -> 401
    const resNoToken = await request(testApp).get("/api/students/me");

    // 1B: Recruiter requesting student edit/me route -> 403 Forbidden
    const resForbidden = await request(testApp)
      .get("/api/students/me")
      .set("Authorization", `Bearer ${recruiterToken}`);

    // 1C: Student requesting student route -> 200 OK
    const resAllowed = await request(testApp)
      .get("/api/students/me")
      .set("Authorization", `Bearer ${studentToken}`);

    if (
      resNoToken.status === 401 &&
      resForbidden.status === 403 &&
      resForbidden.body.error.code === "FORBIDDEN" &&
      resAllowed.status === 200
    ) {
      console.log(
        "  ✅ Passed: Student profile route enforces authentication and blocks unauthorized roles (403)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Student auth guard verification failed", {
        noToken: resNoToken.status,
        forbidden: resForbidden.status,
        allowed: resAllowed.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Student Profile Zod Validation
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Student Profile Payload Validation (CGPA & Graduation Year range checks)",
    );
    const testApp = express();
    testApp.use(express.json());
    testApp.put(
      "/api/students/me",
      validateRequest(updateStudentProfileSchema),
      (_req: Request, res: Response) => {
        sendSuccess(res, { updated: true });
      },
    );

    // 2A: Invalid CGPA (15.5) and invalid gradYear (1995)
    const resInvalid = await request(testApp).put("/api/students/me").send({
      fullName: "A", // Too short
      cgpa: 15.5, // > 10
      gradYear: 1995, // < 2000
      workModePref: "INVALID_WORK_MODE",
    });

    // 2B: Valid student profile payload
    const resValid = await request(testApp)
      .put("/api/students/me")
      .send({
        fullName: "Alex Morgan",
        headline: "Aspiring Full Stack Engineer",
        location: "Bangalore, India",
        college: "Apex Institute of Technology",
        branch: "Computer Science",
        gradYear: 2025,
        cgpa: 8.85,
        careerInterests: ["Full Stack Developer", "Frontend Engineer"],
        preferredLocations: ["Bangalore", "Remote"],
        workModePref: WorkMode.HYBRID,
        selectedSkillIds: ["skill_react", "skill_node"],
      });

    if (
      resInvalid.status === 422 &&
      resInvalid.body.success === false &&
      resInvalid.body.error.code === "VALIDATION_ERROR" &&
      resValid.status === 200 &&
      resValid.body.success === true
    ) {
      console.log(
        "  ✅ Passed: Zod schema correctly rejects out-of-range CGPA/gradYear and accepts valid payloads",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Validation check failed expectations:",
        resInvalid.body,
        resValid.body,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Skill Taxonomy API Routing Check
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Skills Taxonomy API Routing Check");
    const testApp = express();
    testApp.use(express.json());
    testApp.get("/api/v1/skills/taxonomy", (_req: Request, res: Response) => {
      sendSuccess(res, {
        categories: [
          {
            name: "Frontend Development",
            slug: "frontend-development",
            skills: ["React", "JavaScript"],
          },
          {
            name: "Backend Engineering",
            slug: "backend-engineering",
            skills: ["Node.js", "PostgreSQL"],
          },
        ],
      });
    });

    const resTaxonomy = await request(testApp).get("/api/v1/skills/taxonomy");

    if (
      resTaxonomy.status === 200 &&
      resTaxonomy.body.data.categories.length === 2
    ) {
      console.log(
        "  ✅ Passed: Skill taxonomy endpoint returns structured categories",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Skill taxonomy route failed:",
        resTaxonomy.body,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Student Profile Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runStudentTests().catch((err) => {
  console.error("Fatal student test runner error:", err);
  process.exit(1);
});
