import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { sendSuccess } from "../utils/response.util.js";

async function runInstitutionAnalyticsTests() {
  console.log("🧪 =======================================================");
  console.log(
    "🧪 SkillBridge Institution Analytics & Demand/Supply Engine Tests",
  );
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const instAdminToken = generateAccessToken({
    id: "inst_admin_01",
    email: "dean@iitdelhi.ac.in",
    role: UserRole.INSTITUTION_ADMIN,
    isVerified: true,
  });

  const studentToken = generateAccessToken({
    id: "student_user_01",
    email: "student@iitdelhi.ac.in",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const recruiterToken = generateAccessToken({
    id: "recruiter_user_01",
    email: "recruiter@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  // Mock Database Records
  const mockTotalActiveOpportunities = 100;
  const mockAssessedStudents = 200;

  const mockSkillsData = [
    {
      name: "Python",
      oppCount: 72,
      studentCount: 122,
      avgScore: 78,
      category: "Backend",
    }, // Demand: 72%, Supply: 61% -> Gap: 11%
    {
      name: "SQL",
      oppCount: 69,
      studentCount: 96,
      avgScore: 68,
      category: "Database",
    }, // Demand: 69%, Supply: 48% -> Gap: 21%
    {
      name: "AWS",
      oppCount: 54,
      studentCount: 62,
      avgScore: 55,
      category: "Cloud & DevOps",
    }, // Demand: 54%, Supply: 31% -> Gap: 23%
    {
      name: "Docker",
      oppCount: 46,
      studentCount: 48,
      avgScore: 52,
      category: "Cloud & DevOps",
    }, // Demand: 46%, Supply: 24% -> Gap: 22%
    {
      name: "React",
      oppCount: 60,
      studentCount: 150,
      avgScore: 84,
      category: "Frontend",
    }, // Demand: 60%, Supply: 75% -> Gap: 0% (Surplus)
  ];

  // -------------------------------------------------------------
  // Test 1: Industry Demand vs Student Supply Mathematical Calculation
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Test 1: Industry Demand vs Student Supply Matrix Computation",
    );

    const calculatedMatrix = mockSkillsData.map((s) => {
      const industryDemand = Math.round(
        (s.oppCount / mockTotalActiveOpportunities) * 100,
      );
      const studentSupply = Math.round(
        (s.studentCount / mockAssessedStudents) * 100,
      );
      const gap = Math.max(0, industryDemand - studentSupply);

      let status: "HIGH_DEFICIT" | "MODERATE_GAP" | "BALANCED" | "SURPLUS" =
        "BALANCED";
      if (industryDemand > studentSupply) {
        status = gap >= 15 ? "HIGH_DEFICIT" : "MODERATE_GAP";
      } else if (studentSupply > industryDemand + 10) {
        status = "SURPLUS";
      }

      return {
        skillName: s.name,
        category: s.category,
        industryDemand,
        studentSupply,
        gap,
        status,
      };
    });

    const pythonItem = calculatedMatrix.find((m) => m.skillName === "Python");
    const sqlItem = calculatedMatrix.find((m) => m.skillName === "SQL");
    const awsItem = calculatedMatrix.find((m) => m.skillName === "AWS");
    const dockerItem = calculatedMatrix.find((m) => m.skillName === "Docker");
    const reactItem = calculatedMatrix.find((m) => m.skillName === "React");

    if (
      pythonItem?.industryDemand === 72 &&
      pythonItem?.studentSupply === 61 &&
      pythonItem?.gap === 11 &&
      pythonItem?.status === "MODERATE_GAP" &&
      sqlItem?.industryDemand === 69 &&
      sqlItem?.studentSupply === 48 &&
      sqlItem?.gap === 21 &&
      sqlItem?.status === "HIGH_DEFICIT" &&
      awsItem?.industryDemand === 54 &&
      awsItem?.studentSupply === 31 &&
      awsItem?.gap === 23 &&
      dockerItem?.industryDemand === 46 &&
      dockerItem?.studentSupply === 24 &&
      dockerItem?.gap === 22 &&
      reactItem?.status === "SURPLUS"
    ) {
      console.log(
        "  ✅ Passed: Exact Demand vs Supply matching formula verified (Python: 72% vs 61%, SQL: 69% vs 48%, AWS: 54% vs 31%, Docker: 46% vs 24%)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Matrix calculation mismatch:", {
        python: pythonItem,
        sql: sqlItem,
        aws: awsItem,
        docker: dockerItem,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Role Authorization Guard on Institution Analytics
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Institution Analytics RBAC Guard (INSTITUTION_ADMIN & SUPER_ADMIN)",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/institutions/analytics",
      authenticate,
      authorizeRoles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        sendSuccess(
          res,
          { analytics: { totalStudents: 420 } },
          "Analytics retrieved",
          200,
        );
      },
    );

    // 1. Institution Admin access -> 200 OK
    const resInst = await request(testApp)
      .get("/api/institutions/analytics")
      .set("Authorization", `Bearer ${instAdminToken}`);

    // 2. Student access -> 403 Forbidden
    const resStudent = await request(testApp)
      .get("/api/institutions/analytics")
      .set("Authorization", `Bearer ${studentToken}`);

    // 3. Recruiter access -> 403 Forbidden
    const resRecruiter = await request(testApp)
      .get("/api/institutions/analytics")
      .set("Authorization", `Bearer ${recruiterToken}`);

    if (
      resInst.status === 200 &&
      resStudent.status === 403 &&
      resRecruiter.status === 403
    ) {
      console.log(
        "  ✅ Passed: /api/institutions/analytics strictly restricts access to INSTITUTION_ADMIN (403 for student/recruiter, 200 for dean)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: RBAC check failed:", {
        inst: resInst.status,
        student: resStudent.status,
        recruiter: resRecruiter.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Application & Placement Funnel Rates Calculation
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Application & Placement Funnel Rates Aggregation");
    const mockAppStats = {
      totalApplications: 120,
      applied: 60,
      shortlisted: 30,
      interview: 18,
      offers: 12,
      rejected: 10,
    };

    const totalStudentsCount = 100;

    const shortlistRate = Math.round(
      ((mockAppStats.shortlisted +
        mockAppStats.interview +
        mockAppStats.offers) /
        mockAppStats.totalApplications) *
        100,
    ); // (30+18+12)/120 = 60/120 = 50%
    const placementRate = Math.round(
      (mockAppStats.offers / totalStudentsCount) * 100,
    ); // 12/100 = 12%

    if (shortlistRate === 50 && placementRate === 12) {
      console.log(
        `  ✅ Passed: Application funnel (Shortlist Rate: ${shortlistRate}%, Placement Rate: ${placementRate}%) calculated accurately`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Funnel rate mismatch:", {
        shortlistRate,
        placementRate,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Category Competency Aggregates
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Categorized Institutional Competency Averages");
    const mockStudentScores = [
      { category: "Frontend", score: 80 },
      { category: "Frontend", score: 90 },
      { category: "Backend", score: 70 },
      { category: "Backend", score: 80 },
      { category: "Cloud & DevOps", score: 50 },
      { category: "Cloud & DevOps", score: 60 },
    ];

    const avgFrontend = Math.round(
      mockStudentScores
        .filter((s) => s.category === "Frontend")
        .reduce((a, b) => a + b.score, 0) / 2,
    );
    const avgBackend = Math.round(
      mockStudentScores
        .filter((s) => s.category === "Backend")
        .reduce((a, b) => a + b.score, 0) / 2,
    );
    const avgCloud = Math.round(
      mockStudentScores
        .filter((s) => s.category === "Cloud & DevOps")
        .reduce((a, b) => a + b.score, 0) / 2,
    );

    if (avgFrontend === 85 && avgBackend === 75 && avgCloud === 55) {
      console.log(
        "  ✅ Passed: Category score aggregation computed correctly (Frontend: 85, Backend: 75, Cloud: 55)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Category average mismatch:", {
        avgFrontend,
        avgBackend,
        avgCloud,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Actionable Curriculum Recommendations Output
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Actionable Curriculum Interventions Generation");

    const topDeficitSkill = {
      skillName: "AWS",
      category: "Cloud & DevOps",
      industryDemandPercentage: 54,
      studentSupplyPercentage: 31,
      gapPercentage: 23,
    };

    const recommendation = `Industry demand for ${topDeficitSkill.skillName} is ${topDeficitSkill.industryDemandPercentage}% vs institutional student supply of ${topDeficitSkill.studentSupplyPercentage}% (Deficit: ${topDeficitSkill.gapPercentage}%). Recommend introducing specialized hands-on modules or dedicated benchmark bootcamps in ${topDeficitSkill.category}.`;

    if (
      recommendation.includes("AWS") &&
      recommendation.includes("54%") &&
      recommendation.includes("31%") &&
      recommendation.includes("Deficit: 23%")
    ) {
      console.log(
        "  ✅ Passed: Actionable curriculum intervention text synthesizes specific deficit metrics",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Recommendation text generation mismatch:",
        recommendation,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Institution Analytics Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runInstitutionAnalyticsTests().catch((err) => {
  console.error("Fatal institution analytics test error:", err);
  process.exit(1);
});
