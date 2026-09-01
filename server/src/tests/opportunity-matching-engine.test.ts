import { OpportunityType, WorkMode } from "@prisma/client";
import {
  OpportunityMatchingEngine,
  StudentMatchProfile,
  OpportunityMatchInput,
} from "../modules/opportunities/opportunity-matching.engine.js";

async function runOpportunityMatchingEngineTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Opportunity Matching Engine Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const mockOpportunity: OpportunityMatchInput = {
    id: "opp-frontend-01",
    title: "Frontend Developer Intern",
    slug: "frontend-developer-intern",
    type: OpportunityType.INTERNSHIP,
    description:
      "Looking for React and TypeScript engineers for modern SaaS UI platform.",
    workMode: WorkMode.HYBRID,
    location: "Bangalore, India",
    minCgpa: 7.0,
    eligibleBranches: ["Computer Science", "Information Technology"],
    eligibleGradYears: [2025, 2026],
    duration: "6 Months",
    stipendSalary: "₹35,000 / month",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    company: {
      id: "comp-01",
      companyName: "TechCorp Innovations",
      industry: "Enterprise Software & Cloud Platforms",
      location: "Bangalore, India",
      isVerified: true,
    },
    requiredSkills: [
      {
        skillId: "s-react",
        skillName: "React",
        minScore: 70,
        isMandatory: true,
        weight: 1.2,
      },
      {
        skillId: "s-js",
        skillName: "JavaScript",
        minScore: 70,
        isMandatory: true,
        weight: 1.2,
      },
      {
        skillId: "s-git",
        skillName: "Git",
        minScore: 60,
        isMandatory: false,
        weight: 0.8,
      },
      {
        skillId: "s-docker",
        skillName: "Docker",
        minScore: 60,
        isMandatory: false,
        weight: 0.8,
      },
    ],
  };

  // -------------------------------------------------------------
  // Test 1: Scenario A — Perfect 100% Candidate Alignment
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Perfect 100% Multi-Factor Alignment");

    const perfectStudent: StudentMatchProfile = {
      id: "student-perfect",
      fullName: "Alex Morgan",
      cgpa: 9.0,
      branch: "Computer Science",
      gradYear: 2025,
      careerInterests: ["Frontend Developer", "React"],
      preferredLocations: ["Bangalore"],
      workModePref: WorkMode.HYBRID,
      skills: [
        { skillId: "s-react", skillName: "React", score: 85 },
        { skillId: "s-js", skillName: "JavaScript", score: 90 },
        { skillId: "s-git", skillName: "Git", score: 75 },
        { skillId: "s-docker", skillName: "Docker", score: 70 },
      ],
      projectCount: 3,
      certificationCount: 1,
      assessmentCount: 4,
    };

    const result = OpportunityMatchingEngine.calculateMatch(
      perfectStudent,
      mockOpportunity,
    );

    if (
      result.matchScore === 100 &&
      result.matchFit === "HIGH_FIT" &&
      result.matchingSkills.length === 4 &&
      result.missingSkills.length === 0 &&
      result.eligibilityResult.isEligible === true &&
      result.breakdown.skillCompatibility.score === 100 &&
      result.breakdown.eligibility.score === 100
    ) {
      console.log(
        "  ✅ Passed: Perfect candidate scores 100% HIGH_FIT with all 4 skills satisfied and full factor scores",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Perfect match failed. Result:", result);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Scenario B — Partial Match (React, JS, Git met; Docker missing)
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Partial Match with Exact Gap Identification (~85-90%)",
    );

    const partialStudent: StudentMatchProfile = {
      id: "student-partial",
      fullName: "Samira Rao",
      cgpa: 8.2,
      branch: "Computer Science",
      gradYear: 2025,
      careerInterests: ["Frontend Developer"],
      preferredLocations: ["Bangalore"],
      workModePref: WorkMode.HYBRID,
      skills: [
        { skillId: "s-react", skillName: "React", score: 80 }, // Met
        { skillId: "s-js", skillName: "JavaScript", score: 75 }, // Met
        { skillId: "s-git", skillName: "Git", score: 65 }, // Met
        { skillId: "s-docker", skillName: "Docker", score: 0 }, // Missing: Gap = 60pts
      ],
      projectCount: 2,
      certificationCount: 1,
      assessmentCount: 2,
    };

    const result = OpportunityMatchingEngine.calculateMatch(
      partialStudent,
      mockOpportunity,
    );

    if (
      result.matchScore >= 80 &&
      result.matchFit === "HIGH_FIT" &&
      result.matchingSkills.length === 3 &&
      result.missingSkills.length === 1 &&
      result.missingSkills[0].skillName === "Docker" &&
      result.missingSkills[0].gapPoints === 60 &&
      result.eligibilityResult.isEligible === true
    ) {
      console.log(
        `  ✅ Passed: Partial match outputs exact score (${result.matchScore}%), flags Docker as missing (-60pts), and confirms 3 matching skills (React, JS, Git)`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Partial match failed:", result);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Scenario C — Ineligible Candidate (CGPA below cutoff)
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Academic Ineligibility Penalty Evaluation");

    const ineligibleStudent: StudentMatchProfile = {
      id: "student-ineligible",
      fullName: "Rahul Sharma",
      cgpa: 5.5, // Required: 7.0
      branch: "Mechanical Engineering", // Not in eligibleBranches
      gradYear: 2027, // Not in eligibleGradYears
      careerInterests: ["Frontend Developer"],
      preferredLocations: ["Bangalore"],
      workModePref: WorkMode.HYBRID,
      skills: [
        { skillId: "s-react", skillName: "React", score: 90 },
        { skillId: "s-js", skillName: "JavaScript", score: 90 },
      ],
    };

    const result = OpportunityMatchingEngine.calculateMatch(
      ineligibleStudent,
      mockOpportunity,
    );

    if (
      result.eligibilityResult.isEligible === false &&
      result.eligibilityResult.cgpaMet === false &&
      result.eligibilityResult.branchMet === false &&
      result.eligibilityResult.gradYearMet === false &&
      result.breakdown.eligibility.score < 40
    ) {
      console.log(
        `  ✅ Passed: Academic ineligibility correctly penalizes eligibility score (${result.breakdown.eligibility.score}%) and flags isEligible: false`,
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Ineligibility evaluation failed:",
        result.eligibilityResult,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Scenario D — Unassessed / Zero Skills Baseline
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Unassessed / Zero Skills Candidate");

    const blankStudent: StudentMatchProfile = {
      id: "student-blank",
      fullName: "New User",
      cgpa: 7.5,
      branch: "Computer Science",
      gradYear: 2025,
      careerInterests: [],
      preferredLocations: [],
      workModePref: WorkMode.ANY,
      skills: [],
    };

    const result = OpportunityMatchingEngine.calculateMatch(
      blankStudent,
      mockOpportunity,
    );

    if (
      result.breakdown.skillCompatibility.score === 0 &&
      result.missingSkills.length === 4 &&
      result.matchFit === "DEVELOPING"
    ) {
      console.log(
        `  ✅ Passed: Unassessed profile yields 0% skill score, classifies as DEVELOPING (${result.matchScore}%), and flags all 4 competencies as gaps`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Zero skills baseline failed:", result);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Scenario E — 5-Factor Normalization Weight Integrity (50+20+15+10+5=100)
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 5: 5-Factor Normalization & Weight Proportions Check",
    );

    const totalWeightPercent =
      OpportunityMatchingEngine.WEIGHTS.SKILL_COMPATIBILITY * 100 +
      OpportunityMatchingEngine.WEIGHTS.ELIGIBILITY * 100 +
      OpportunityMatchingEngine.WEIGHTS.CAREER_INTEREST * 100 +
      OpportunityMatchingEngine.WEIGHTS.EXPERIENCE * 100 +
      OpportunityMatchingEngine.WEIGHTS.LOCATION_PREFERENCE * 100;

    if (Math.round(totalWeightPercent) === 100) {
      console.log(
        `  ✅ Passed: Multi-factor weights strictly sum to 100% (Skills: 50%, Eligibility: 20%, Interest: 15%, Experience: 10%, Location: 5%)`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Weights sum mismatch:", totalWeightPercent);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Opportunity Matching Engine Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runOpportunityMatchingEngineTests().catch((err) => {
  console.error("Fatal matching engine test error:", err);
  process.exit(1);
});
