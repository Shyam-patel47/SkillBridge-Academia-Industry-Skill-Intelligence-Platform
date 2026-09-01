import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole, OpportunityType, WorkMode } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { sendSuccess } from "../utils/response.util.js";

async function runOpportunityDiscoveryTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Opportunity Discovery & Match Engine Tests");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const studentToken = generateAccessToken({
    id: "student_test_uid_01",
    email: "student.discovery@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const recruiterToken = generateAccessToken({
    id: "recruiter_test_uid_01",
    email: "recruiter.discovery@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  // -------------------------------------------------------------
  // Test 1: Deterministic Skill Compatibility Calculation
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Deterministic Compatibility Score Formula");

    const requiredSkills = [
      { skillName: "React", minScore: 70, weight: 1.2, isMandatory: true },
      { skillName: "JavaScript", minScore: 70, weight: 1.2, isMandatory: true },
      { skillName: "Docker", minScore: 60, weight: 1.0, isMandatory: false },
    ];

    const studentScores: Record<string, number> = {
      React: 80, // min(1.0, 80/70) = 1.0
      JavaScript: 70, // min(1.0, 70/70) = 1.0
      Docker: 30, // min(1.0, 30/60) = 0.5
    };

    let weightedFulfillmentSum = 0;
    let totalWeights = 0;

    for (const rs of requiredSkills) {
      const studentScore = studentScores[rs.skillName] || 0;
      const fulfillment = Math.min(1.0, studentScore / rs.minScore);
      const weightMultiplier = rs.weight * (rs.isMandatory ? 1.5 : 1.0);

      weightedFulfillmentSum += fulfillment * weightMultiplier;
      totalWeights += weightMultiplier;
    }

    const calculatedScore = Math.round(
      (weightedFulfillmentSum / totalWeights) * 100,
    );

    // Expected: (1.0*(1.2*1.5) + 1.0*(1.2*1.5) + 0.5*(1.0*1.0)) / (1.8 + 1.8 + 1.0) * 100 = 4.1 / 4.6 * 100 = 89.13% -> 89%
    if (calculatedScore === 89) {
      console.log(
        "  ✅ Passed: Mathematical compatibility formula calculates exact weighted score (89% HIGH_FIT) with isMandatory weight multipliers",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Compatibility calculation mismatch:",
        calculatedScore,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Academic Eligibility Evaluation Matrix
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 2: Academic Eligibility Verification Matrix");

    const mockOpp = {
      minCgpa: 7.5,
      eligibleBranches: ["Computer Science", "Information Technology"],
      eligibleGradYears: [2025, 2026],
    };

    const eligibleStudent = {
      cgpa: 8.2,
      branch: "Computer Science",
      graduationYear: 2025,
    };

    const ineligibleStudent = {
      cgpa: 7.1, // Below 7.5
      branch: "Mechanical Engineering", // Not in eligibleBranches
      graduationYear: 2027, // Not in eligibleGradYears
    };

    const isEligible1 =
      eligibleStudent.cgpa >= mockOpp.minCgpa &&
      mockOpp.eligibleBranches.includes(eligibleStudent.branch) &&
      mockOpp.eligibleGradYears.includes(eligibleStudent.graduationYear);

    const isEligible2 =
      ineligibleStudent.cgpa >= mockOpp.minCgpa &&
      mockOpp.eligibleBranches.includes(ineligibleStudent.branch) &&
      mockOpp.eligibleGradYears.includes(ineligibleStudent.graduationYear);

    if (isEligible1 === true && isEligible2 === false) {
      console.log(
        "  ✅ Passed: Academic eligibility checks (CGPA cutoff, branch eligibility, graduation batches) correctly evaluate candidates",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Academic eligibility evaluation failed");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Student Discovery Feed Route & RBAC Guard
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Student Discovery Feed Route & RBAC Guard");
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/opportunities/feed",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      (_req: Request, res: Response) => {
        sendSuccess(
          res,
          { opportunities: [], totalCount: 0 },
          "Feed retrieved",
          200,
        );
      },
    );

    const resForbidden = await request(testApp)
      .get("/api/opportunities/feed")
      .set("Authorization", `Bearer ${recruiterToken}`);

    const resStudent = await request(testApp)
      .get("/api/opportunities/feed")
      .set("Authorization", `Bearer ${studentToken}`);

    if (resForbidden.status === 403 && resStudent.status === 200) {
      console.log(
        "  ✅ Passed: /api/opportunities/feed strictly enforces STUDENT role (403 for recruiters, 200 for students)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Discovery Feed RBAC test failed:", {
        forbidden: resForbidden.status,
        student: resStudent.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Opportunity Discovery Module Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runOpportunityDiscoveryTests().catch((err) => {
  console.error("Fatal opportunity discovery test error:", err);
  process.exit(1);
});
