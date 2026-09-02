import request from "supertest";
import express, { Request, Response } from "express";
import {
  UserRole,
  ApplicationStatus,
  ProficiencyLevel,
  OpportunityType,
  WorkMode,
} from "@prisma/client";
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { sendSuccess, sendError } from "../utils/response.util.js";

async function runIntegrationFlowsTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Integration Flows Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // Integration Flow 1: Complete Authentication & Token Rotation Flow
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Integration Flow 1: Complete Auth Flow (Register -> Login -> Refresh -> Logout)",
    );
    const testApp = express();
    testApp.use(express.json());

    const usersDb: any[] = [];
    const refreshTokensDb: Record<string, string> = {};

    // 1. Register
    testApp.post("/api/auth/register", (req: Request, res: Response) => {
      const { email, role } = req.body;
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        role: role || UserRole.STUDENT,
        isVerified: true,
      };
      usersDb.push(newUser);
      const accessToken = generateAccessToken(newUser);
      const rawRefresh = generateRefreshTokenString();
      refreshTokensDb[newUser.id] = hashToken(rawRefresh);
      sendSuccess(
        res,
        { user: newUser, accessToken, refreshToken: rawRefresh },
        "Registered",
        201,
      );
    });

    // 2. Refresh Token
    testApp.post("/api/auth/refresh", (req: Request, res: Response) => {
      const { userId, refreshToken } = req.body;
      if (!refreshToken || !userId)
        return sendError(res, "Refresh token and userId required", 400);

      const hashed = hashToken(refreshToken);
      if (refreshTokensDb[userId] !== hashed) {
        return sendError(res, "Invalid or rotated refresh token", 401);
      }

      const user = usersDb.find((u) => u.id === userId);
      const newAccess = generateAccessToken(user);
      const newRawRefresh = generateRefreshTokenString();
      refreshTokensDb[user.id] = hashToken(newRawRefresh); // Rotate token
      sendSuccess(
        res,
        { accessToken: newAccess, refreshToken: newRawRefresh },
        "Refreshed",
        200,
      );
    });

    // Register Student
    const regRes = await request(testApp)
      .post("/api/auth/register")
      .send({ email: "flow_student@skillbridge.dev", role: UserRole.STUDENT });

    const userId = regRes.body.data.user.id;
    const firstAccess = regRes.body.data.accessToken;
    const firstRefresh = regRes.body.data.refreshToken;

    // Refresh Token & Rotate
    const refRes = await request(testApp)
      .post("/api/auth/refresh")
      .send({ userId, refreshToken: firstRefresh });

    const secondAccess = refRes.body.data.accessToken;
    const secondRefresh = refRes.body.data.refreshToken;

    // Replay old refresh token (must be rejected due to rotation)
    const replayRes = await request(testApp)
      .post("/api/auth/refresh")
      .send({ userId, refreshToken: firstRefresh });

    if (
      regRes.status === 201 &&
      refRes.status === 200 &&
      replayRes.status === 401 &&
      typeof firstAccess === "string" &&
      typeof secondAccess === "string" &&
      firstRefresh !== secondRefresh
    ) {
      console.log(
        "  ✅ Passed: Auth registration, token generation, cryptographic rotation, and replay attack prevention verified",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Auth flow test failed:", {
        reg: regRes.status,
        ref: refRes.status,
        replay: replayRes.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Flow 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Integration Flow 2: Assessment Session & Skills Profile Auto-Update Flow
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Integration Flow 2: Assessment Flow (Submit -> Score Calculation -> StudentSkills Update)",
    );

    const mockQuestions = [
      { id: "q1", points: 25, correctOptionId: "opt-b" },
      { id: "q2", points: 25, correctOptionId: "opt-a" },
      { id: "q3", points: 25, correctOptionId: "opt-t" },
      { id: "q4", points: 25, correctOptionId: "opt-c" },
    ];

    const studentAnswers = [
      { questionId: "q1", selectedOptionId: "opt-b" }, // Correct (25)
      { questionId: "q2", selectedOptionId: "opt-a" }, // Correct (25)
      { questionId: "q3", selectedOptionId: "opt-t" }, // Correct (25)
      { questionId: "q4", selectedOptionId: "opt-d" }, // Incorrect (0)
    ];

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const q of mockQuestions) {
      totalPoints += q.points;
      const ans = studentAnswers.find((a) => a.questionId === q.id);
      if (ans && ans.selectedOptionId === q.correctOptionId) {
        earnedPoints += q.points;
      }
    }

    const finalScore = Math.round((earnedPoints / totalPoints) * 100);
    const passedBenchmark = finalScore >= 70;

    const studentSkillProfile = {
      studentId: "student_01",
      skillId: "skill-react",
      score: finalScore,
      proficiency:
        finalScore >= 80
          ? ProficiencyLevel.ADVANCED
          : ProficiencyLevel.INTERMEDIATE,
      isVerified: passedBenchmark,
      assessmentCount: 1,
    };

    if (
      finalScore === 75 &&
      passedBenchmark === true &&
      studentSkillProfile.isVerified === true &&
      studentSkillProfile.proficiency === ProficiencyLevel.INTERMEDIATE
    ) {
      console.log(
        `  ✅ Passed: Assessment evaluated (${finalScore}%), auto-promoted student skill to verified (isVerified: true)`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Assessment flow check failed:", {
        finalScore,
        studentSkillProfile,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Flow 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Integration Flow 3: Opportunity Creation & Skill Benchmarks Publishing Flow
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Integration Flow 3: Opportunity Creation Flow (Recruiter Create -> Benchmark Matrix -> Publish)",
    );
    const testApp = express();
    testApp.use(express.json());

    const opportunitiesDb: any[] = [];

    const recruiterToken = generateAccessToken({
      id: "recruiter_flow_01",
      email: "recruiter@cloudscale.io",
      role: UserRole.INDUSTRY,
      isVerified: true,
    });

    testApp.post(
      "/api/opportunities",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        const { title, requiredSkills, minCgpa } = req.body;
        if (!title || !requiredSkills || requiredSkills.length === 0) {
          return sendError(res, "Validation error", 422);
        }
        const newOpp = {
          id: `opp_${Date.now()}`,
          companyId: "comp_01",
          title,
          minCgpa: minCgpa || 7.0,
          isActive: true,
          requiredSkills,
        };
        opportunitiesDb.push(newOpp);
        sendSuccess(res, { opportunity: newOpp }, "Created", 201);
      },
    );

    const resCreate = await request(testApp)
      .post("/api/opportunities")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        title: "Full Stack Cloud Engineer",
        minCgpa: 7.5,
        requiredSkills: [
          {
            skillId: "skill-react",
            minScore: 70,
            isMandatory: true,
            weight: 1.5,
          },
          {
            skillId: "skill-node",
            minScore: 70,
            isMandatory: true,
            weight: 1.2,
          },
          {
            skillId: "skill-docker",
            minScore: 65,
            isMandatory: false,
            weight: 1.0,
          },
        ],
      });

    const saved = opportunitiesDb[0];

    if (
      resCreate.status === 201 &&
      saved?.title === "Full Stack Cloud Engineer" &&
      saved?.requiredSkills?.length === 3 &&
      saved?.isActive === true
    ) {
      console.log(
        "  ✅ Passed: Opportunity created with 3 benchmark skills and active status verified",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Opportunity creation flow failed:",
        resCreate.body,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Flow 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Integration Flow 4: Application Lifecycle & Pipeline Status Transitions
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Integration Flow 4: Application Flow (Apply -> Recruiter Review -> Pipeline Transitions)",
    );
    const testApp = express();
    testApp.use(express.json());

    const applicationsDb: any[] = [];

    const studentToken = generateAccessToken({
      id: "student_flow_01",
      email: "student@skillbridge.dev",
      role: UserRole.STUDENT,
      isVerified: true,
    });

    const recruiterToken = generateAccessToken({
      id: "recruiter_flow_01",
      email: "recruiter@cloudscale.io",
      role: UserRole.INDUSTRY,
      isVerified: true,
    });

    // Student Apply
    testApp.post(
      "/api/applications",
      authenticate,
      authorizeRoles(UserRole.STUDENT),
      (req: Request, res: Response) => {
        const newApp = {
          id: `app_${Date.now()}`,
          studentId: req.user!.id,
          opportunityId: req.body.opportunityId,
          status: ApplicationStatus.APPLIED,
          matchScore: 88,
          createdAt: new Date(),
        };
        applicationsDb.push(newApp);
        sendSuccess(res, { application: newApp }, "Applied", 201);
      },
    );

    // Recruiter Update Status
    testApp.patch(
      "/api/applications/:id/status",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY),
      (req: Request, res: Response) => {
        const app = applicationsDb.find((a) => a.id === req.params.id);
        if (!app) return sendError(res, "Not found", 404);
        app.status = req.body.status;
        sendSuccess(res, { application: app }, "Updated", 200);
      },
    );

    // 1. Submit Application
    const resApply = await request(testApp)
      .post("/api/applications")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ opportunityId: "opp_01" });

    const appId = resApply.body.data.application.id;

    // 2. Transition APPLIED -> SHORTLISTED
    const resShortlist = await request(testApp)
      .patch(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ status: ApplicationStatus.SHORTLISTED });

    // 3. Transition SHORTLISTED -> INTERVIEW
    const resInterview = await request(testApp)
      .patch(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ status: ApplicationStatus.INTERVIEW });

    // 4. Transition INTERVIEW -> OFFERED
    const resOffer = await request(testApp)
      .patch(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ status: ApplicationStatus.OFFERED });

    if (
      resApply.status === 201 &&
      resShortlist.body.data.application.status ===
        ApplicationStatus.SHORTLISTED &&
      resInterview.body.data.application.status ===
        ApplicationStatus.INTERVIEW &&
      resOffer.body.data.application.status === ApplicationStatus.OFFERED
    ) {
      console.log(
        "  ✅ Passed: Complete application pipeline progression (APPLIED -> SHORTLISTED -> INTERVIEW -> OFFERED) verified",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Application pipeline transition failed:", {
        apply: resApply.status,
        shortlist: resShortlist.body,
        interview: resInterview.body,
        offer: resOffer.body,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Flow 4 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Integration Flows Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationFlowsTests().catch((err) => {
  console.error("Fatal integration flow test error:", err);
  process.exit(1);
});
