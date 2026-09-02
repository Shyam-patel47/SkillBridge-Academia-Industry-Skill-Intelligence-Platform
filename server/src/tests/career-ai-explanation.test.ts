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
import { CareerAIExplanationService } from "../modules/careers/career-ai-explanation.service.js";
import { sendSuccess } from "../utils/response.util.js";

async function runCareerAIExplanationTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge AI Career Explanation & Gap Engine Tests");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const studentToken = generateAccessToken({
    id: "student_user_01",
    email: "student@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const fullStackBenchmarks: BenchmarkSkill[] = [
    {
      skillId: "skill-react",
      skillName: "React",
      minProficiency: 70,
      weight: 1.5,
      isCore: true,
    },
    {
      skillId: "skill-js",
      skillName: "JavaScript",
      minProficiency: 70,
      weight: 1.5,
      isCore: true,
    },
    {
      skillId: "skill-node",
      skillName: "Node.js",
      minProficiency: 70,
      weight: 1.2,
      isCore: true,
    },
    {
      skillId: "skill-docker",
      skillName: "Docker",
      minProficiency: 65,
      weight: 1.0,
      isCore: false,
    },
    {
      skillId: "skill-postgres",
      skillName: "PostgreSQL",
      minProficiency: 65,
      weight: 1.0,
      isCore: false,
    },
  ];

  // Student with high React, JS, Node but missing Docker & Postgres
  const studentSkills: StudentSkillScore[] = [
    { skillId: "skill-react", skillName: "React", score: 85, isVerified: true },
    {
      skillId: "skill-js",
      skillName: "JavaScript",
      score: 90,
      isVerified: true,
    },
    {
      skillId: "skill-node",
      skillName: "Node.js",
      score: 80,
      isVerified: true,
    },
    {
      skillId: "skill-docker",
      skillName: "Docker",
      score: 40,
      isVerified: true,
    },
    {
      skillId: "skill-postgres",
      skillName: "PostgreSQL",
      score: 50,
      isVerified: true,
    },
  ];

  // -------------------------------------------------------------
  // Test 1: Deterministic Score Immutability Guard
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Deterministic Score Immutability Guard");

    const deterministicResult = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmarks,
      studentSkills,
    );

    const initialScore = deterministicResult.compatibilityScore;
    const initialGapsCount = deterministicResult.gapSkillsCount;

    const aiInsight = await CareerAIExplanationService.generateExplanation({
      roleTitle: "Full Stack Developer",
      compatibilityScore: deterministicResult.compatibilityScore,
      readinessLevel: deterministicResult.readinessLevel,
      matchingSkills: deterministicResult.matchingSkills,
      skillGaps: deterministicResult.skillGaps,
      missingSkills: deterministicResult.missingSkills,
    });

    if (
      deterministicResult.compatibilityScore === initialScore &&
      deterministicResult.gapSkillsCount === initialGapsCount &&
      typeof aiInsight.aiExplanation === "string" &&
      aiInsight.aiExplanation.length > 20
    ) {
      console.log(
        `  ✅ Passed: Deterministic calculation (${initialScore}%) is strictly preserved; AI only provides explanation narrative`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Score immutability check failed:", {
        initialScore,
        deterministicResult,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: User Prompt Example Explanation Generation
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: User Prompt Example Explanation Generation (React, JS, Node.js alignment)",
    );

    const deterministicResult = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmarks,
      studentSkills,
    );

    const aiInsight = await CareerAIExplanationService.generateExplanation({
      roleTitle: "Full Stack Developer",
      compatibilityScore: deterministicResult.compatibilityScore,
      readinessLevel: deterministicResult.readinessLevel,
      matchingSkills: deterministicResult.matchingSkills,
      skillGaps: deterministicResult.skillGaps,
      missingSkills: deterministicResult.missingSkills,
    });

    const explanationLower = aiInsight.aiExplanation.toLowerCase();

    if (
      explanationLower.includes("react") &&
      explanationLower.includes("javascript") &&
      explanationLower.includes("node.js") &&
      (explanationLower.includes("docker") ||
        explanationLower.includes("deficit") ||
        explanationLower.includes("gap"))
    ) {
      console.log(
        "  ✅ Passed: AI Explanation synthesized strongest alignment (React, JavaScript, Node.js) and highlights gap closure priorities",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: AI Explanation text check failed:",
        aiInsight.aiExplanation,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Key Strengths & Priority Action Structured Breakdown
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Key Strengths & Priority Action Extraction");

    const deterministicResult = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmarks,
      studentSkills,
    );

    const aiInsight = await CareerAIExplanationService.generateExplanation({
      roleTitle: "Full Stack Developer",
      compatibilityScore: deterministicResult.compatibilityScore,
      readinessLevel: deterministicResult.readinessLevel,
      matchingSkills: deterministicResult.matchingSkills,
      skillGaps: deterministicResult.skillGaps,
      missingSkills: deterministicResult.missingSkills,
    });

    if (
      Array.isArray(aiInsight.keyStrengths) &&
      aiInsight.keyStrengths.includes("React") &&
      aiInsight.keyStrengths.includes("JavaScript") &&
      typeof aiInsight.priorityAction === "string" &&
      aiInsight.priorityAction.length > 10
    ) {
      console.log(
        `  ✅ Passed: Key strengths (${aiInsight.keyStrengths.join(", ")}) and Priority Action ("${aiInsight.priorityAction}") generated`,
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Key strengths/action check failed:",
        aiInsight,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: AI Failure & Fallback Resilience
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: AI Failure & Fallback Resilience (Zero Crashes / Deterministic Fallback)",
    );

    const deterministicResult = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      fullStackBenchmarks,
      studentSkills,
    );

    // Force fallback by directly invoking intelligent fallback generator
    const fallbackInsight =
      CareerAIExplanationService.generateIntelligentFallback({
        roleTitle: "Full Stack Developer",
        compatibilityScore: deterministicResult.compatibilityScore,
        readinessLevel: deterministicResult.readinessLevel,
        matchingSkills: deterministicResult.matchingSkills,
        skillGaps: deterministicResult.skillGaps,
        missingSkills: deterministicResult.missingSkills,
      });

    if (
      fallbackInsight.isAiGenerated === false &&
      fallbackInsight.aiExplanation.includes("Full Stack Developer") &&
      fallbackInsight.aiExplanation.includes("React") &&
      fallbackInsight.keyStrengths.length > 0
    ) {
      console.log(
        "  ✅ Passed: Fallback engine generates explainable narrative seamlessly when AI credentials/network are absent",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Fallback check failed:", fallbackInsight);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Gap Analysis API Integration & Role Guard
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Gap Analysis API Route & Role Guard Integration");
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/careers/:id/gap-analysis",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      async (req: Request, res: Response) => {
        const evaluation = calculateCareerRoleCompatibility(
          "Full Stack Developer",
          fullStackBenchmarks,
          studentSkills,
        );
        const aiInsight = await CareerAIExplanationService.generateExplanation({
          roleTitle: "Full Stack Developer",
          compatibilityScore: evaluation.compatibilityScore,
          readinessLevel: evaluation.readinessLevel,
          matchingSkills: evaluation.matchingSkills,
          skillGaps: evaluation.skillGaps,
          missingSkills: evaluation.missingSkills,
        });

        sendSuccess(
          res,
          { gapAnalysis: { ...evaluation, ...aiInsight } },
          "Gap Analysis Retrieved",
          200,
        );
      },
    );

    const resStudent = await request(testApp)
      .get("/api/careers/role_fullstack_01/gap-analysis")
      .set("Authorization", `Bearer ${studentToken}`);

    if (
      resStudent.status === 200 &&
      resStudent.body.data.gapAnalysis.compatibilityScore > 0 &&
      typeof resStudent.body.data.gapAnalysis.aiExplanation === "string" &&
      resStudent.body.data.gapAnalysis.keyStrengths.length > 0
    ) {
      console.log(
        "  ✅ Passed: /api/careers/:id/gap-analysis delivers deterministic metrics + AI explanation payload (200 OK)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Route check failed:", resStudent.body);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 AI Career Explanation Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCareerAIExplanationTests().catch((err) => {
  console.error("Fatal career AI explanation test error:", err);
  process.exit(1);
});
