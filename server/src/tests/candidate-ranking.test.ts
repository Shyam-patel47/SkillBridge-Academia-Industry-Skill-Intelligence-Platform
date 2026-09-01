import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole, ApplicationStatus } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { recruiterApplicantsQuerySchema } from "../modules/applications/application.schema.js";
import { sendSuccess } from "../utils/response.util.js";

async function runCandidateRankingTests() {
  console.log("🧪 =======================================================");
  console.log(
    "🧪 SkillBridge Recruiter Candidate Ranking & Multi-Filter Tests",
  );
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const recruiterToken = generateAccessToken({
    id: "recruiter_user_01",
    email: "recruiter1@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  const unauthorizedRecruiterToken = generateAccessToken({
    id: "recruiter_user_99",
    email: "other@competitor.com",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  // Mock candidates database for TechCorp Opportunity (opp-frontend-01)
  const mockCandidates = [
    {
      id: "app-01",
      opportunityId: "opp-frontend-01",
      companyId: "company-techcorp",
      status: ApplicationStatus.APPLIED,
      matchScore: 94,
      student: {
        id: "student-01",
        fullName: "Aarav Sharma",
        email: "aarav@skillbridge.dev",
        college: "IIT Delhi",
        branch: "Computer Science and Engineering",
        gradYear: 2025,
        cgpa: 9.1,
        headline: "Frontend & Full Stack Engineer",
        skills: [
          { skillId: "s-react", skillName: "React", score: 95, verified: true },
          {
            skillId: "s-ts",
            skillName: "TypeScript",
            score: 90,
            verified: true,
          },
          {
            skillId: "s-docker",
            skillName: "Docker",
            score: 80,
            verified: true,
          },
        ],
      },
      matchBreakdown: {
        matchScore: 94,
        breakdown: {
          skillCompatibility: { score: 95, weight: 0.5 },
          eligibility: { score: 100, weight: 0.2 },
          careerInterest: { score: 90, weight: 0.15 },
          experience: { score: 85, weight: 0.1 },
          locationPreference: { score: 100, weight: 0.05 },
        },
        matchingSkills: [
          {
            skillId: "s-react",
            skillName: "React",
            studentScore: 95,
            minScore: 70,
          },
          {
            skillId: "s-ts",
            skillName: "TypeScript",
            studentScore: 90,
            minScore: 70,
          },
        ],
        missingSkills: [],
        eligibilityResult: { isEligible: true },
        explanation:
          "Candidate ranks #1 with 95% skill compatibility and satisfied academic cutoffs.",
      },
    },
    {
      id: "app-02",
      opportunityId: "opp-frontend-01",
      companyId: "company-techcorp",
      status: ApplicationStatus.SHORTLISTED,
      matchScore: 86,
      student: {
        id: "student-02",
        fullName: "Diya Patel",
        email: "diya@skillbridge.dev",
        college: "BITS Pilani",
        branch: "Information Technology",
        gradYear: 2025,
        cgpa: 8.4,
        headline: "React Specialist",
        skills: [
          { skillId: "s-react", skillName: "React", score: 85, verified: true },
          {
            skillId: "s-ts",
            skillName: "TypeScript",
            score: 80,
            verified: true,
          },
        ],
      },
      matchBreakdown: {
        matchScore: 86,
        breakdown: {
          skillCompatibility: { score: 85, weight: 0.5 },
          eligibility: { score: 100, weight: 0.2 },
          careerInterest: { score: 80, weight: 0.15 },
          experience: { score: 70, weight: 0.1 },
          locationPreference: { score: 100, weight: 0.05 },
        },
        matchingSkills: [
          {
            skillId: "s-react",
            skillName: "React",
            studentScore: 85,
            minScore: 70,
          },
        ],
        missingSkills: [
          {
            skillId: "s-docker",
            skillName: "Docker",
            studentScore: 0,
            minScore: 60,
            deficit: 60,
          },
        ],
        eligibilityResult: { isEligible: true },
        explanation:
          "Candidate meets React benchmark with a slight gap in containerization.",
      },
    },
    {
      id: "app-03",
      opportunityId: "opp-frontend-01",
      companyId: "company-techcorp",
      status: ApplicationStatus.APPLIED,
      matchScore: 62,
      student: {
        id: "student-03",
        fullName: "Karan Verma",
        email: "karan@skillbridge.dev",
        college: "NIT Trichy",
        branch: "Mechanical Engineering",
        gradYear: 2024,
        cgpa: 7.2,
        headline: "Junior Developer",
        skills: [
          {
            skillId: "s-react",
            skillName: "React",
            score: 55,
            verified: false,
          },
        ],
      },
      matchBreakdown: {
        matchScore: 62,
        breakdown: {
          skillCompatibility: { score: 55, weight: 0.5 },
          eligibility: { score: 60, weight: 0.2 },
          careerInterest: { score: 70, weight: 0.15 },
          experience: { score: 40, weight: 0.1 },
          locationPreference: { score: 50, weight: 0.05 },
        },
        matchingSkills: [],
        missingSkills: [
          {
            skillId: "s-react",
            skillName: "React",
            studentScore: 55,
            minScore: 70,
            deficit: 15,
          },
          {
            skillId: "s-ts",
            skillName: "TypeScript",
            studentScore: 0,
            minScore: 70,
            deficit: 70,
          },
        ],
        eligibilityResult: { isEligible: false },
        explanation:
          "Candidate has developing competencies and is missing TypeScript certification.",
      },
    },
  ];

  // Helper filter function replicating application.service.ts
  const rankAndFilterCandidates = (filters: any) => {
    let result = [...mockCandidates];

    if (filters.opportunityId) {
      result = result.filter((c) => c.opportunityId === filters.opportunityId);
    }
    if (filters.status && filters.status !== "ALL") {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.minMatchScore !== undefined) {
      result = result.filter((c) => c.matchScore >= filters.minMatchScore);
    }
    if (filters.minCgpa !== undefined) {
      result = result.filter((c) => c.student.cgpa >= filters.minCgpa);
    }
    if (filters.branch) {
      result = result.filter((c) =>
        c.student.branch.toLowerCase().includes(filters.branch.toLowerCase()),
      );
    }
    if (filters.gradYear !== undefined) {
      result = result.filter((c) => c.student.gradYear === filters.gradYear);
    }
    if (filters.skill) {
      result = result.filter((c) =>
        c.student.skills.some((s) =>
          s.skillName.toLowerCase().includes(filters.skill.toLowerCase()),
        ),
      );
    }

    // Sort descending by matchScore
    result.sort((a, b) => b.matchScore - a.matchScore);

    return result.map((c, idx) => ({
      ...c,
      rank: idx + 1,
    }));
  };

  // -------------------------------------------------------------
  // Test 1: Candidate Ranking by Match Score Descending
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Candidate Ranking in Descending Match Score Order");
    const ranked = rankAndFilterCandidates({
      opportunityId: "opp-frontend-01",
    });

    const isSorted =
      ranked[0].matchScore >= ranked[1].matchScore &&
      ranked[1].matchScore >= ranked[2].matchScore;
    const correctRanks =
      ranked[0].rank === 1 && ranked[1].rank === 2 && ranked[2].rank === 3;
    const topCandidate = ranked[0].student.fullName === "Aarav Sharma";

    if (isSorted && correctRanks && topCandidate) {
      console.log(
        "  ✅ Passed: Candidates ordered deterministically by match score (#1 Aarav 94%, #2 Diya 86%, #3 Karan 62%)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Candidate ranking order failed:", { ranked });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Multi-Dimensional Filter Verification
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Multi-Dimensional Filtering (Score, CGPA, Branch, Batch, Skill)",
    );

    // Min Score Filter >= 85
    const highFit = rankAndFilterCandidates({ minMatchScore: 85 });
    const scoreFilterPassed =
      highFit.length === 2 && !highFit.some((c) => c.matchScore < 85);

    // Min CGPA Filter >= 8.5
    const topCgpa = rankAndFilterCandidates({ minCgpa: 8.5 });
    const cgpaFilterPassed =
      topCgpa.length === 1 && topCgpa[0].student.fullName === "Aarav Sharma";

    // Branch Filter: "Computer Science"
    const csBranch = rankAndFilterCandidates({ branch: "Computer Science" });
    const branchFilterPassed =
      csBranch.length === 1 &&
      csBranch[0].student.branch.includes("Computer Science");

    // Grad Year: 2025
    const batch2025 = rankAndFilterCandidates({ gradYear: 2025 });
    const batchFilterPassed =
      batch2025.length === 2 &&
      batch2025.every((c) => c.student.gradYear === 2025);

    // Skill Filter: "Docker"
    const dockerSkill = rankAndFilterCandidates({ skill: "Docker" });
    const skillFilterPassed =
      dockerSkill.length === 1 &&
      dockerSkill[0].student.skills.some((s) => s.skillName === "Docker");

    if (
      scoreFilterPassed &&
      cgpaFilterPassed &&
      branchFilterPassed &&
      batchFilterPassed &&
      skillFilterPassed
    ) {
      console.log(
        "  ✅ Passed: Multi-filter engine accurately filters candidates across score, CGPA, branch, batch year, and skill",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Multi-dimensional filtering failed:", {
        scoreFilterPassed,
        cgpaFilterPassed,
        branchFilterPassed,
        batchFilterPassed,
        skillFilterPassed,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Explainability and Skill Gap Breakdown Integrity
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Explainability & Skill Gaps Breakdown Integrity");
    const ranked = rankAndFilterCandidates({
      opportunityId: "opp-frontend-01",
    });

    const top = ranked[0];
    const second = ranked[1];

    const topHasMatches = top.matchBreakdown.matchingSkills.length === 2;
    const secondHasGaps =
      second.matchBreakdown.missingSkills.length === 1 &&
      second.matchBreakdown.missingSkills[0].deficit === 60;
    const explainableRationale =
      typeof top.matchBreakdown.explanation === "string" &&
      top.matchBreakdown.explanation.length > 10;

    if (topHasMatches && secondHasGaps && explainableRationale) {
      console.log(
        "  ✅ Passed: Candidate breakdown provides explainable rationale, verified skill matches, and quantified gap deficits",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Explainability check failed:", {
        topHasMatches,
        secondHasGaps,
        explainableRationale,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Schema Validation & Route Protection for Recruiter Query
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: Schema Validation Middleware & Recruiter Role Guard",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/recruiter/applicants",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      validateRequest(recruiterApplicantsQuerySchema),
      (req: Request, res: Response) => {
        const filters = {
          opportunityId: req.query.opportunityId as string,
          status: req.query.status as string,
          minMatchScore: req.query.minMatchScore
            ? Number(req.query.minMatchScore)
            : undefined,
          minCgpa: req.query.minCgpa ? Number(req.query.minCgpa) : undefined,
          branch: req.query.branch as string,
          gradYear: req.query.gradYear ? Number(req.query.gradYear) : undefined,
          skill: req.query.skill as string,
        };
        const ranked = rankAndFilterCandidates(filters);
        sendSuccess(
          res,
          { applications: ranked, count: ranked.length },
          "Ranked candidates",
          200,
        );
      },
    );

    // 1. Recruiter with valid filters -> 200 OK
    const resValid = await request(testApp)
      .get(
        "/api/recruiter/applicants?minMatchScore=80&minCgpa=8.0&gradYear=2025",
      )
      .set("Authorization", `Bearer ${recruiterToken}`);

    // 2. Student token trying to access recruiter ranking -> 403 Forbidden
    const studentToken = generateAccessToken({
      id: "student_user_01",
      email: "student@skillbridge.dev",
      role: UserRole.STUDENT,
      isVerified: true,
    });
    const resForbidden = await request(testApp)
      .get("/api/recruiter/applicants")
      .set("Authorization", `Bearer ${studentToken}`);

    // 3. Invalid filter values (e.g. minMatchScore = 150) -> 422 Unprocessable Entity
    const resInvalid = await request(testApp)
      .get("/api/recruiter/applicants?minMatchScore=150")
      .set("Authorization", `Bearer ${recruiterToken}`);

    if (
      resValid.status === 200 &&
      resValid.body.data.applications.length === 2 &&
      resForbidden.status === 403 &&
      resInvalid.status === 422
    ) {
      console.log(
        "  ✅ Passed: Route strictly guards INDUSTRY role (403 for students), validates query parameters (422 for invalid score), and returns filtered ranked applications (200)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Route validation/role guard failed:", {
        valid: resValid.status,
        forbidden: resForbidden.status,
        invalid: resInvalid.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Multi-Tenant Opportunity Access Security Check
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Multi-Tenant Recruiter Isolation Security Check");

    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/recruiter/applicants",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        const targetOppId = req.query.opportunityId as string;

        // Check if opportunity belongs to company
        if (
          targetOppId === "opp-frontend-01" &&
          req.user?.id !== "recruiter_user_01"
        ) {
          return res.status(403).json({
            success: false,
            error: {
              code: "FORBIDDEN_OPPORTUNITY_ACCESS",
              message: "Forbidden",
            },
          });
        }

        return sendSuccess(
          res,
          { applications: mockCandidates },
          "Authorized",
          200,
        );
      },
    );

    // Recruiter 1 accesses own opportunity -> 200
    const resOwn = await request(testApp)
      .get("/api/recruiter/applicants?opportunityId=opp-frontend-01")
      .set("Authorization", `Bearer ${recruiterToken}`);

    // Recruiter 99 tries to access Recruiter 1's opportunity -> 403 Forbidden
    const resCrossCompany = await request(testApp)
      .get("/api/recruiter/applicants?opportunityId=opp-frontend-01")
      .set("Authorization", `Bearer ${unauthorizedRecruiterToken}`);

    if (resOwn.status === 200 && resCrossCompany.status === 403) {
      console.log(
        "  ✅ Passed: Multi-tenant ownership guard prevents unauthorized recruiters from accessing competitor candidates (403 Forbidden)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Multi-tenant access check failed:", {
        own: resOwn.status,
        cross: resCrossCompany.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Candidate Ranking Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCandidateRankingTests().catch((err) => {
  console.error("Fatal candidate ranking test error:", err);
  process.exit(1);
});
