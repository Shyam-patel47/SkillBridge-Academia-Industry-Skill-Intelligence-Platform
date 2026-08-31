import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  calculateCareerRoleCompatibility,
  BenchmarkSkill,
  StudentSkillScore,
} from "../modules/careers/skill-gap.engine.js";
import { sendSuccess } from "../utils/response.util.js";

async function runCareerGapTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Career Role & Skill Gap Engine Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const fullStackBenchmark: BenchmarkSkill[] = [
    {
      skillId: "sk_js",
      skillName: "JavaScript",
      minProficiency: 70,
      weight: 1.0,
      isCore: true,
    },
    {
      skillId: "sk_react",
      skillName: "React",
      minProficiency: 70,
      weight: 1.0,
      isCore: true,
    },
    {
      skillId: "sk_node",
      skillName: "Node.js",
      minProficiency: 65,
      weight: 1.0,
      isCore: true,
    },
    {
      skillId: "sk_sql",
      skillName: "SQL",
      minProficiency: 60,
      weight: 1.0,
      isCore: true,
    },
    {
      skillId: "sk_git",
      skillName: "Git",
      minProficiency: 60,
      weight: 1.0,
      isCore: false,
    },
    {
      skillId: "sk_docker",
      skillName: "Docker",
      minProficiency: 50,
      weight: 1.0,
      isCore: false,
    },
  ];

  // -------------------------------------------------------------
  // Test 1: Perfect Alignment (100% Fit)
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Scenario A — Perfect 100% Benchmark Alignment");
    const studentSkills: StudentSkillScore[] = [
      { skillId: "sk_js", skillName: "JavaScript", score: 85 },
      { skillId: "sk_react", skillName: "React", score: 90 },
      { skillId: "sk_node", skillName: "Node.js", score: 80 },
      { skillId: "sk_sql", skillName: "SQL", score: 75 },
      { skillId: "sk_git", skillName: "Git", score: 70 },
      { skillId: "sk_docker", skillName: "Docker", score: 65 },
    ];

    const result = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmark,
      studentSkills,
    );

    if (
      result.compatibilityScore === 100 &&
      result.readinessLevel === "HIGH_FIT" &&
      result.matchingSkills.length === 6 &&
      result.skillGaps.length === 0 &&
      result.missingSkills.length === 0
    ) {
      console.log(
        "  ✅ Passed: All student scores meet or exceed benchmark -> 100% HIGH_FIT, 0 gaps",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Perfect alignment test failed:", result);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Realistic Partial Fit (~89% with Matching & Gaps)
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Scenario B — Partial Alignment with Exact Skill Gaps",
    );
    const studentSkills: StudentSkillScore[] = [
      { skillId: "sk_js", skillName: "JavaScript", score: 80 }, // 80/70 -> 1.0
      { skillId: "sk_react", skillName: "React", score: 80 }, // 80/70 -> 1.0
      { skillId: "sk_node", skillName: "Node.js", score: 70 }, // 70/65 -> 1.0
      { skillId: "sk_sql", skillName: "SQL", score: 65 }, // 65/60 -> 1.0
      { skillId: "sk_git", skillName: "Git", score: 45 }, // 45/60 -> 0.75 (15pt gap)
      { skillId: "sk_docker", skillName: "Docker", score: 30 }, // 30/50 -> 0.60 (20pt gap)
    ];

    const result = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmark,
      studentSkills,
    );

    // Expected: (1.0 + 1.0 + 1.0 + 1.0 + 0.75 + 0.60) / 6 = 5.35 / 6 = 89.2%
    const matchingNames = result.matchingSkills.map((s) => s.skillName);
    const gapNames = result.skillGaps.map((s) => s.skillName);

    if (
      result.compatibilityScore === 89.2 &&
      result.readinessLevel === "HIGH_FIT" &&
      matchingNames.includes("JavaScript") &&
      matchingNames.includes("React") &&
      matchingNames.includes("Node.js") &&
      matchingNames.includes("SQL") &&
      gapNames.includes("Git") &&
      gapNames.includes("Docker") &&
      result.explanation.includes("Full Stack Developer")
    ) {
      console.log(
        "  ✅ Passed: Deterministic scoring outputs exact 89.2% with 4 matching and 2 gap skills (Git: 15pt, Docker: 20pt)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Partial alignment test failed:", {
        score: result.compatibilityScore,
        matchingNames,
        gapNames,
        explanation: result.explanation,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Unassessed / Zero Skills
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Scenario C — Unassessed / Zero Skills Baseline");
    const result = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmark,
      [],
    );

    if (
      result.compatibilityScore === 0 &&
      result.readinessLevel === "DEVELOPING" &&
      result.missingSkills.length === 6 &&
      result.matchingSkills.length === 0
    ) {
      console.log(
        "  ✅ Passed: Unassessed profile correctly yields 0% score and flags all 6 skills as missing",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Zero skills test failed:", result);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Weighted Core Skills Sensitivity
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Scenario D — Core Skill Weight Sensitivity");
    const weightedBenchmark: BenchmarkSkill[] = [
      {
        skillId: "sk_core",
        skillName: "Core Competency",
        minProficiency: 100,
        weight: 3.0,
        isCore: true,
      },
      {
        skillId: "sk_sec",
        skillName: "Secondary Skill",
        minProficiency: 100,
        weight: 1.0,
        isCore: false,
      },
    ];

    // Case A: Perfect on core (100), 0 on secondary -> (3*1.0 + 1*0) / 4 = 75.0%
    const resA = calculateCareerRoleCompatibility(
      "Test Role",
      weightedBenchmark,
      [
        { skillId: "sk_core", skillName: "Core Competency", score: 100 },
        { skillId: "sk_sec", skillName: "Secondary Skill", score: 0 },
      ],
    );

    // Case B: 0 on core, perfect on secondary (100) -> (3*0 + 1*1.0) / 4 = 25.0%
    const resB = calculateCareerRoleCompatibility(
      "Test Role",
      weightedBenchmark,
      [
        { skillId: "sk_core", skillName: "Core Competency", score: 0 },
        { skillId: "sk_sec", skillName: "Secondary Skill", score: 100 },
      ],
    );

    if (resA.compatibilityScore === 75.0 && resB.compatibilityScore === 25.0) {
      console.log(
        "  ✅ Passed: Core skills weight ratio (3:1) accurately shifts compatibility score (75% vs 25%)",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Weight sensitivity test failed:",
        resA.compatibilityScore,
        resB.compatibilityScore,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Recommendation API Route & Role Authorization Guard
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Career Recommendations Route & RBAC Guard");
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/careers/recommendations",
      authenticate,
      authorizeRoles(UserRole.STUDENT),
      (_req: Request, res: Response) => {
        sendSuccess(res, {
          recommendations: [
            {
              careerRole: { title: "Full Stack Developer" },
              compatibilityScore: 89.2,
            },
          ],
        });
      },
    );

    const studentToken = generateAccessToken({
      id: "student_test_uid_01",
      email: "student.career.test@skillbridge.dev",
      role: UserRole.STUDENT,
      isVerified: true,
    });

    const recruiterToken = generateAccessToken({
      id: "recruiter_test_uid_01",
      email: "recruiter.career.test@techcorp.io",
      role: UserRole.INDUSTRY,
      isVerified: true,
    });

    // 5A: Unauthenticated -> 401
    const resUnauth = await request(testApp).get(
      "/api/careers/recommendations",
    );

    // 5B: Recruiter -> 403
    const resForbidden = await request(testApp)
      .get("/api/careers/recommendations")
      .set("Authorization", `Bearer ${recruiterToken}`);

    // 5C: Student -> 200 OK
    const resStudent = await request(testApp)
      .get("/api/careers/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    if (
      resUnauth.status === 401 &&
      resForbidden.status === 403 &&
      resStudent.status === 200 &&
      resStudent.body.data.recommendations.length === 1
    ) {
      console.log(
        "  ✅ Passed: /api/careers/recommendations enforces authentication and student role guard (403)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Recommendation route test failed:", {
        unauth: resUnauth.status,
        forbidden: resForbidden.status,
        student: resStudent.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Career Role & Skill Gap Engine Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCareerGapTests().catch((err) => {
  console.error("Fatal career gap test error:", err);
  process.exit(1);
});
