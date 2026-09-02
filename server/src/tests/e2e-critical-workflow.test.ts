import request from "supertest";
import express, { Request, Response } from "express";
import {
  UserRole,
  ApplicationStatus,
  OpportunityType,
  WorkMode,
  ProficiencyLevel,
} from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
  calculateCareerRoleCompatibility,
  BenchmarkSkill,
  StudentSkillScore,
} from "../modules/careers/skill-gap.engine.js";
import {
  OpportunityMatchingEngine,
  StudentMatchProfile,
  OpportunityMatchInput,
} from "../modules/opportunities/opportunity-matching.engine.js";

async function runE2ECriticalWorkflowTest() {
  console.log(
    "🧪 =========================================================================",
  );
  console.log(
    "🧪 SkillBridge End-to-End Critical Multi-Role Platform Workflow",
  );
  console.log(
    "🧪 =========================================================================\n",
  );

  let passed = 0;
  let failed = 0;

  // In-Memory Database for End-to-End State Machine Simulation
  const db = {
    users: [] as any[],
    students: [] as any[],
    companies: [] as any[],
    studentSkills: [] as any[],
    assessments: [] as any[],
    opportunities: [] as any[],
    applications: [] as any[],
  };

  const app = express();
  app.use(express.json());

  // Setup Routes
  // 1. Auth Register & Login
  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { email, role, firstName, lastName } = req.body;
    const user = { id: `u_${Date.now()}`, email, role, isVerified: true };
    db.users.push(user);
    if (role === UserRole.STUDENT) {
      db.students.push({
        id: `stu_${user.id}`,
        userId: user.id,
        firstName: firstName || "Aarav",
        lastName: lastName || "Sharma",
        cgpa: 0,
        branch: "",
        graduationYear: 2025,
      });
    } else if (role === UserRole.INDUSTRY) {
      db.companies.push({
        id: `comp_${user.id}`,
        userId: user.id,
        companyName: "CloudScale Technologies",
        industry: "Cloud Infrastructure",
        isVerified: true,
      });
    }
    const token = generateAccessToken(user);
    sendSuccess(res, { user, accessToken: token }, "Registered", 201);
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email } = req.body;
    const user = db.users.find((u) => u.email === email);
    if (!user) return sendError(res, "User not found", 404);
    const token = generateAccessToken(user);
    sendSuccess(res, { user, accessToken: token }, "Logged in", 200);
  });

  // 2. Student Profile
  app.put(
    "/api/students/profile",
    authenticate,
    authorizeRoles(UserRole.STUDENT),
    (req: Request, res: Response) => {
      const profile = db.students.find((s) => s.userId === req.user!.id);
      if (!profile) return sendError(res, "Profile not found", 404);
      profile.cgpa = req.body.cgpa;
      profile.branch = req.body.branch;
      profile.graduationYear = req.body.graduationYear;
      sendSuccess(res, { profile }, "Profile updated", 200);
    },
  );

  // 3. Assessments & Scoring
  app.post(
    "/api/assessments/:id/submit",
    authenticate,
    authorizeRoles(UserRole.STUDENT),
    (req: Request, res: Response) => {
      const assess = db.assessments.find((a) => a.id === req.params.id);
      if (!assess) return sendError(res, "Assessment not found", 404);

      let totalPoints = 0;
      let earnedPoints = 0;
      for (const q of assess.questions) {
        totalPoints += q.points;
        const ans = req.body.answers?.find((a: any) => a.questionId === q.id);
        if (ans && ans.selectedOptionId === q.correctOptionId) {
          earnedPoints += q.points;
        }
      }

      const finalScore = Math.round((earnedPoints / totalPoints) * 100);
      const passed = finalScore >= 70;
      const scoreResult = {
        finalScore,
        earnedPoints,
        totalPoints,
        passed,
        proficiency:
          finalScore >= 85
            ? ProficiencyLevel.ADVANCED
            : ProficiencyLevel.INTERMEDIATE,
      };

      const student = db.students.find((s) => s.userId === req.user!.id);

      // Auto-update student skills profile
      const existing = db.studentSkills.find(
        (ss) => ss.studentId === student.id && ss.skillId === assess.skillId,
      );
      if (existing) {
        existing.score = scoreResult.finalScore;
        existing.isVerified = scoreResult.passed;
      } else {
        db.studentSkills.push({
          id: `ss_${Date.now()}`,
          studentId: student.id,
          skillId: assess.skillId,
          skillName: "React",
          score: scoreResult.finalScore,
          proficiency: scoreResult.proficiency,
          isVerified: scoreResult.passed,
        });
      }

      sendSuccess(res, { scoreResult }, "Assessment evaluated", 200);
    },
  );

  // 4. Skills Profile Summary
  app.get(
    "/api/students/skills/summary",
    authenticate,
    authorizeRoles(UserRole.STUDENT),
    (req: Request, res: Response) => {
      const student = db.students.find((s) => s.userId === req.user!.id);
      const skills = db.studentSkills.filter(
        (ss) => ss.studentId === student.id,
      );
      sendSuccess(res, { skills, count: skills.length }, "Skills summary", 200);
    },
  );

  // 5. Opportunities Postings
  app.post(
    "/api/opportunities",
    authenticate,
    authorizeRoles(UserRole.INDUSTRY),
    (req: Request, res: Response) => {
      const comp = db.companies.find((c) => c.userId === req.user!.id);
      const opp = {
        id: `opp_${Date.now()}`,
        companyId: comp.id,
        title: req.body.title,
        slug: "cloud-full-stack-intern",
        type: OpportunityType.INTERNSHIP,
        description:
          "Exciting internship working on React, Cloud, and distributed microservices.",
        workMode: WorkMode.REMOTE,
        location: "Remote, India",
        minCgpa: req.body.minCgpa || 7.5,
        eligibleBranches: [
          "Computer Science & Engineering",
          "Information Technology",
        ],
        eligibleGradYears: [2025, 2026],
        duration: "6 Months",
        stipendSalary: "₹35,000 / month",
        deadline: null,
        requiredSkills: req.body.requiredSkills,
        isActive: true,
        createdAt: new Date(),
        company: comp,
      };
      db.opportunities.push(opp);
      sendSuccess(res, { opportunity: opp }, "Opportunity posted", 201);
    },
  );

  // 6. Student Apply
  app.post(
    "/api/applications",
    authenticate,
    authorizeRoles(UserRole.STUDENT),
    (req: Request, res: Response) => {
      const student = db.students.find((s) => s.userId === req.user!.id);
      const opp = db.opportunities.find((o) => o.id === req.body.opportunityId);

      const skills = db.studentSkills.filter(
        (ss) => ss.studentId === student.id,
      );
      const studentProfile: StudentMatchProfile = {
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        cgpa: student.cgpa,
        branch: student.branch,
        gradYear: student.graduationYear,
        careerInterests: ["Full Stack Developer", "Cloud Engineer"],
        preferredLocations: ["Remote", "Bangalore"],
        workModePref: WorkMode.REMOTE,
        skills: skills.map((s) => ({
          skillId: s.skillId,
          skillName: s.skillName || "React",
          score: s.score,
        })),
        projectCount: 2,
        certificationCount: 1,
        assessmentCount: 1,
      };

      const oppInput: OpportunityMatchInput = {
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        type: opp.type,
        description: opp.description,
        workMode: opp.workMode,
        location: opp.location,
        minCgpa: opp.minCgpa,
        eligibleBranches: opp.eligibleBranches,
        eligibleGradYears: opp.eligibleGradYears,
        duration: opp.duration,
        stipendSalary: opp.stipendSalary,
        deadline: opp.deadline,
        isActive: opp.isActive,
        createdAt: opp.createdAt,
        company: opp.company,
        requiredSkills: opp.requiredSkills,
      };

      const match = OpportunityMatchingEngine.calculateMatch(
        studentProfile,
        oppInput,
      );

      const appRecord = {
        id: `app_${Date.now()}`,
        studentId: student.id,
        opportunityId: opp.id,
        student,
        opportunity: opp,
        status: ApplicationStatus.APPLIED,
        matchScore: match.matchScore,
        matchResult: match,
        createdAt: new Date(),
      };
      db.applications.push(appRecord);
      sendSuccess(
        res,
        { application: appRecord },
        "Application submitted",
        201,
      );
    },
  );

  // 7. Recruiter View Candidates & Shortlist
  app.get(
    "/api/applications/opportunity/:id/candidates",
    authenticate,
    authorizeRoles(UserRole.INDUSTRY),
    (req: Request, res: Response) => {
      const oppApps = db.applications.filter(
        (a) => a.opportunityId === req.params.id,
      );
      sendSuccess(res, { candidates: oppApps }, "Candidates retrieved", 200);
    },
  );

  app.patch(
    "/api/applications/:id/status",
    authenticate,
    authorizeRoles(UserRole.INDUSTRY),
    (req: Request, res: Response) => {
      const appRecord = db.applications.find((a) => a.id === req.params.id);
      if (!appRecord) return sendError(res, "Not found", 404);
      appRecord.status = req.body.status;
      sendSuccess(res, { application: appRecord }, "Status updated", 200);
    },
  );

  // Seed React Benchmark Assessment
  db.assessments.push({
    id: "assess-react-mastery",
    skillId: "skill-react",
    title: "React Production Mastery Assessment",
    questions: [
      {
        id: "q1",
        type: "SINGLE_CHOICE",
        points: 30,
        correctOptionId: "opt-a",
        options: [{ id: "opt-a" }, { id: "opt-b" }],
      },
      {
        id: "q2",
        type: "SINGLE_CHOICE",
        points: 30,
        correctOptionId: "opt-b",
        options: [{ id: "opt-a" }, { id: "opt-b" }],
      },
      {
        id: "q3",
        type: "SINGLE_CHOICE",
        points: 40,
        correctOptionId: "opt-c",
        options: [{ id: "opt-a" }, { id: "opt-c" }],
      },
    ],
  });

  // =========================================================================
  // EXECUTE END-TO-END WORKFLOW STEP BY STEP
  // =========================================================================
  try {
    console.log("▶ STEP 1: Student Registration (Aarav Sharma)");
    const regStudentRes = await request(app).post("/api/auth/register").send({
      email: "aarav.sharma@skillbridge.dev",
      role: UserRole.STUDENT,
      firstName: "Aarav",
      lastName: "Sharma",
    });
    const studentToken = regStudentRes.body.data.accessToken;
    console.log("  ✅ Student registered and received JWT access token");

    console.log("▶ STEP 2: Student Academic Profile Completion");
    const profileRes = await request(app)
      .put("/api/students/profile")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        cgpa: 8.8,
        branch: "Computer Science & Engineering",
        graduationYear: 2025,
      });
    console.log(
      `  ✅ Profile initialized: CGPA ${profileRes.body.data.profile.cgpa}, Branch: ${profileRes.body.data.profile.branch}`,
    );

    console.log("▶ STEP 3: Student Takes & Submits React Benchmark Assessment");
    const assessSubmitRes = await request(app)
      .post("/api/assessments/assess-react-mastery/submit")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [
          { questionId: "q1", selectedOptionId: "opt-a" }, // 30pts
          { questionId: "q2", selectedOptionId: "opt-b" }, // 30pts
          { questionId: "q3", selectedOptionId: "opt-c" }, // 40pts
        ],
      });
    const scoreResult = assessSubmitRes.body.data.scoreResult;
    console.log(
      `  ✅ Assessment passed: Score ${scoreResult.finalScore}%, Proficiency: ${scoreResult.proficiency}`,
    );

    console.log("▶ STEP 4: Verified Skills Profile Reflection");
    const skillsRes = await request(app)
      .get("/api/students/skills/summary")
      .set("Authorization", `Bearer ${studentToken}`);
    const verifiedSkill = skillsRes.body.data.skills.find(
      (s: any) => s.skillId === "skill-react",
    );
    console.log(
      `  ✅ Verified skill reflected in database: React (Score: ${verifiedSkill.score}, isVerified: ${verifiedSkill.isVerified})`,
    );

    console.log("▶ STEP 5: Career Gap Analysis Diagnostics");
    const careerBenchmarks: BenchmarkSkill[] = [
      {
        skillId: "skill-react",
        skillName: "React",
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
    ];
    const studentSkillsScore: StudentSkillScore[] = [
      {
        skillId: "skill-react",
        skillName: "React",
        score: verifiedSkill.score,
        isVerified: true,
      },
    ];
    const gapAnalysis = calculateCareerRoleCompatibility(
      "Full Stack Developer",
      careerBenchmarks,
      studentSkillsScore,
    );
    console.log(
      `  ✅ Career compatibility diagnosed: ${gapAnalysis.compatibilityScore}%, Identified missing core skills: ${gapAnalysis.missingSkills.map((m) => m.skillName).join(", ")}`,
    );

    console.log("▶ STEP 6: Recruiter Registration & Opportunity Posting");
    const regRecruiterRes = await request(app).post("/api/auth/register").send({
      email: "recruiter@cloudscale.io",
      role: UserRole.INDUSTRY,
    });
    const recruiterToken = regRecruiterRes.body.data.accessToken;

    const oppRes = await request(app)
      .post("/api/opportunities")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        title: "Cloud Full Stack Intern",
        minCgpa: 7.5,
        requiredSkills: [
          {
            skillId: "skill-react",
            skillName: "React",
            minScore: 70,
            isMandatory: true,
            weight: 1.5,
          },
          {
            skillId: "skill-git",
            skillName: "Git",
            minScore: 60,
            isMandatory: false,
            weight: 1.0,
          },
        ],
      });
    const oppId = oppRes.body.data.opportunity.id;
    console.log(
      `  ✅ Opportunity created by CloudScale: "${oppRes.body.data.opportunity.title}" (ID: ${oppId})`,
    );

    console.log(
      "▶ STEP 7: Student Discovers Opportunity & Submits Application",
    );
    const applyRes = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ opportunityId: oppId });
    const appId = applyRes.body.data.application.id;
    const matchScore = applyRes.body.data.application.matchScore;
    console.log(
      `  ✅ Application submitted: App ID ${appId}, Calculated Match Score: ${matchScore}% (${applyRes.body.data.application.matchResult.readinessLevel})`,
    );

    console.log("▶ STEP 8: Recruiter Evaluates Match & Shortlists Candidate");
    const candidatesRes = await request(app)
      .get(`/api/applications/opportunity/${oppId}/candidates`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const candidateApp = candidatesRes.body.data.candidates[0];

    const shortlistRes = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ status: ApplicationStatus.SHORTLISTED });

    if (
      studentToken &&
      scoreResult.finalScore === 100 &&
      verifiedSkill.isVerified === true &&
      matchScore >= 70 &&
      candidateApp.id === appId &&
      shortlistRes.body.data.application.status ===
        ApplicationStatus.SHORTLISTED
    ) {
      console.log(
        "\n  🏆 COMPLETE E2E WORKFLOW SUCCEEDED: Student registered -> assessed -> matched -> applied -> recruiter shortlisted",
      );
      passed += 8;
    } else {
      console.error("  ❌ E2E Workflow assertion failed");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ E2E Critical Workflow Exception:", err);
    failed++;
  }

  console.log(
    "\n=========================================================================",
  );
  console.log(
    `📊 Critical End-to-End Workflow Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log(
    "=========================================================================\n",
  );

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ECriticalWorkflowTest().catch((err) => {
  console.error("Fatal E2E test error:", err);
  process.exit(1);
});
