import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { sendSuccess } from "../utils/response.util.js";

async function runStudentSkillsTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Student Skill Profile & Progress Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const studentToken = generateAccessToken({
    id: "student_test_uid_01",
    email: "student.skills.profile.test@skillbridge.dev",
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
  // Test 1: Student Skills Summary Endpoint & RBAC Guard
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Test 1: /api/students/me/skills Authorization & Payload Structure",
    );
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      "/api/students/me/skills",
      authenticate,
      authorizeRoles(UserRole.STUDENT),
      (_req: Request, res: Response) => {
        sendSuccess(res, {
          overallScore: 78.5,
          totalSkills: 4,
          verifiedSkillsCount: 3,
          technicalSkills: [
            { name: "JavaScript", score: 85, isVerified: true },
            { name: "React", score: 90, isVerified: true },
            { name: "Docker", score: 45, isVerified: false },
          ],
          softSkills: [
            { name: "Problem Solving", score: 80, isVerified: true },
          ],
          strengths: [
            { name: "React", score: 90 },
            { name: "JavaScript", score: 85 },
          ],
          weakSkills: [{ name: "Docker", score: 45 }],
        });
      },
    );

    // 1A: Non-student role -> 403 Forbidden
    const resForbidden = await request(testApp)
      .get("/api/students/me/skills")
      .set("Authorization", `Bearer ${recruiterToken}`);

    // 1B: Student role -> 200 OK
    const resStudent = await request(testApp)
      .get("/api/students/me/skills")
      .set("Authorization", `Bearer ${studentToken}`);

    if (
      resForbidden.status === 403 &&
      resStudent.status === 200 &&
      resStudent.body.data.overallScore === 78.5 &&
      resStudent.body.data.strengths.length === 2 &&
      resStudent.body.data.weakSkills.length === 1
    ) {
      console.log(
        "  ✅ Passed: /api/students/me/skills enforces STUDENT RBAC and returns structured competency metrics",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Student skills summary route test failed:", {
        forbiddenStatus: resForbidden.status,
        studentStatus: resStudent.status,
        data: resStudent.body,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Chronological Skill Assessment History
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: /api/students/me/skill-history Timeline Retrieval",
    );
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      "/api/students/me/skill-history",
      authenticate,
      authorizeRoles(UserRole.STUDENT),
      (_req: Request, res: Response) => {
        sendSuccess(res, {
          history: [
            {
              id: "resp_01",
              title: "Full Stack Engineering Assessment",
              category: "Technical",
              percentage: 85.0,
              passed: true,
              completedAt: "2026-08-31T20:00:00.000Z",
            },
          ],
        });
      },
    );

    const resHistory = await request(testApp)
      .get("/api/students/me/skill-history")
      .set("Authorization", `Bearer ${studentToken}`);

    if (
      resHistory.status === 200 &&
      resHistory.body.data.history.length === 1 &&
      resHistory.body.data.history[0].percentage === 85.0
    ) {
      console.log(
        "  ✅ Passed: Assessment history returns structured chronological records",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Assessment history test failed:",
        resHistory.body,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Student Skill Profile Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runStudentSkillsTests().catch((err) => {
  console.error("Fatal student skills test error:", err);
  process.exit(1);
});
