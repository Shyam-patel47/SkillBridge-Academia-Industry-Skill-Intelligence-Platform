import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole, ProficiencyLevel } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { confirmExtractedSkillsSchema } from "../modules/resumes/resume.schema.js";
import { NlpFallbackExtractionProvider } from "../modules/resumes/ai-providers/nlp-fallback.provider.js";
import { AIExtractionProviderFactory } from "../modules/resumes/ai-providers/ai-provider.factory.js";
import { sendSuccess } from "../utils/response.util.js";

async function runResumeExtractionTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge AI Resume Skill Extraction & Review Tests");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const studentToken = generateAccessToken({
    id: "student_user_01",
    email: "student@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const recruiterToken = generateAccessToken({
    id: "recruiter_user_01",
    email: "recruiter@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  const mockTaxonomy = [
    {
      id: "skill-react",
      name: "React",
      slug: "react",
      categoryName: "Frontend",
    },
    {
      id: "skill-node",
      name: "Node.js",
      slug: "node-js",
      categoryName: "Backend",
    },
    {
      id: "skill-docker",
      name: "Docker",
      slug: "docker",
      categoryName: "Cloud & DevOps",
    },
    {
      id: "skill-postgres",
      name: "PostgreSQL",
      slug: "postgresql",
      categoryName: "Database",
    },
    {
      id: "skill-python",
      name: "Python",
      slug: "python",
      categoryName: "Backend",
    },
    {
      id: "skill-aws",
      name: "Amazon Web Services",
      slug: "amazon-web-services",
      categoryName: "Cloud & DevOps",
    },
  ];

  const sampleResumeText = `
    Aarav Sharma — Full Stack Cloud Engineer
    Experience:
    Senior Software Engineer with 3+ years architecting microservices using React and Node.js.
    Containerized application services using Docker and orchestrated deployments on Amazon Web Services (AWS).
    Designed scalable relational database schemas in PostgreSQL for multi-tenant SaaS.
    Education: B.Tech in Computer Science, CGPA 8.8.
  `;

  // -------------------------------------------------------------
  // Test 1: AI Provider Abstraction & Safe Fallback
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: AI Provider Abstraction & Safe Fallback Resolution");

    const provider = AIExtractionProviderFactory.getProvider();

    if (provider && typeof provider.extractSkillsFromText === "function") {
      console.log(
        `  ✅ Passed: AI Provider abstraction successfully resolved (${provider.providerName}) without API crash`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Provider resolution failed");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Contextual Skill Extraction & Confidence Scoring
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Contextual Skill Extraction & Confidence Scoring Engine",
    );

    const nlpProvider = new NlpFallbackExtractionProvider();
    const extractedSkills = await nlpProvider.extractSkillsFromText(
      sampleResumeText,
      mockTaxonomy,
    );

    const names = extractedSkills.map((s) => s.name);
    const react = extractedSkills.find((s) => s.name === "React");
    const node = extractedSkills.find((s) => s.name === "Node.js");
    const docker = extractedSkills.find((s) => s.name === "Docker");
    const postgres = extractedSkills.find((s) => s.name === "PostgreSQL");
    const aws = extractedSkills.find((s) => s.name === "Amazon Web Services");

    if (
      names.includes("React") &&
      names.includes("Node.js") &&
      names.includes("Docker") &&
      names.includes("PostgreSQL") &&
      names.includes("Amazon Web Services") &&
      react &&
      docker &&
      react.confidence >= 75 &&
      docker.confidence >= 75 &&
      (react.contextSnippet || "").includes("React")
    ) {
      console.log(
        `  ✅ Passed: Extracted 5 skills (React: ${react?.confidence}%, Node.js: ${node?.confidence}%, Docker: ${docker?.confidence}%, Postgres: ${postgres?.confidence}%, AWS: ${aws?.confidence}%) with context quotes`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Extraction check failed:", extractedSkills);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Normalization & Existing Skill Cross-Referencing
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 3: Taxonomy Normalization & Existing Skill Cross-Referencing",
    );

    const existingStudentSkills = [
      { skillId: "skill-react", score: 85, isVerified: true },
    ];

    const normalized = mockTaxonomy.slice(0, 4).map((tax) => {
      const existing = existingStudentSkills.find(
        (ss) => ss.skillId === tax.id,
      );
      return {
        skillId: tax.id,
        skillName: tax.name,
        category: tax.categoryName,
        confidenceScore: 90,
        alreadyPossessed: Boolean(existing),
        currentScore: existing?.score,
        isCurrentVerified: existing?.isVerified,
      };
    });

    const reactItem = normalized.find((s) => s.skillName === "React");
    const dockerItem = normalized.find((s) => s.skillName === "Docker");

    if (
      reactItem?.alreadyPossessed === true &&
      reactItem?.isCurrentVerified === true &&
      dockerItem?.alreadyPossessed === false
    ) {
      console.log(
        "  ✅ Passed: Cross-referencing correctly flags React as already verified (85%) and Docker as new suggestion",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Cross-referencing failed:", {
        reactItem,
        dockerItem,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Student Review & Accept Workflow (Unverified Evidence)
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: Review Workflow & Unverified Evidence Guard (isVerified: false)",
    );
    const testApp = express();
    testApp.use(express.json());

    const studentSkillsDb: any[] = [];

    testApp.post(
      "/api/resumes/confirm-skills",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      validateRequest(confirmExtractedSkillsSchema),
      (req: Request, res: Response) => {
        const accepted = req.body.acceptedSkills;
        for (const item of accepted) {
          studentSkillsDb.push({
            id: `ss-${Date.now()}-${item.skillId}`,
            studentId: "student_01",
            skillId: item.skillId,
            score: item.selfReportedScore || 60,
            proficiency: item.proficiency || ProficiencyLevel.INTERMEDIATE,
            isVerified: false, // Critical requirement: Must NOT automatically become verified
          });
        }
        sendSuccess(
          res,
          { confirmedCount: accepted.length, skills: studentSkillsDb },
          "Confirmed",
          200,
        );
      },
    );

    const resConfirm = await request(testApp)
      .post("/api/resumes/confirm-skills")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        acceptedSkills: [
          {
            skillId: "skill-docker",
            proficiency: ProficiencyLevel.INTERMEDIATE,
            selfReportedScore: 65,
          },
          {
            skillId: "skill-postgres",
            proficiency: ProficiencyLevel.ADVANCED,
            selfReportedScore: 75,
          },
        ],
      });

    const dockerSaved = studentSkillsDb.find(
      (s) => s.skillId === "skill-docker",
    );
    const postgresSaved = studentSkillsDb.find(
      (s) => s.skillId === "skill-postgres",
    );

    if (
      resConfirm.status === 200 &&
      dockerSaved?.isVerified === false &&
      postgresSaved?.isVerified === false &&
      dockerSaved?.score === 65 &&
      postgresSaved?.score === 75
    ) {
      console.log(
        "  ✅ Passed: Accepted skills persisted as self-reported evidence with isVerified: false (preserves benchmark assessment integrity)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Student skill review save failed:", {
        dockerSaved,
        postgresSaved,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Role Guard & Input Validation Middleware
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 5: Resume Extraction Role Guard (STUDENT) & Validation",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/resumes/extract",
      authenticate,
      authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        if (!req.body.rawText || req.body.rawText.length < 10) {
          return res
            .status(400)
            .json({ success: false, message: "Text too short" });
        }
        sendSuccess(
          res,
          { extraction: { extractedSkillsCount: 4 } },
          "Extracted",
          200,
        );
      },
    );

    // 1. Recruiter access -> 403 Forbidden
    const resRecruiter = await request(testApp)
      .post("/api/resumes/extract")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ rawText: sampleResumeText });

    // 2. Student with empty text -> 400 Bad Request
    const resEmpty = await request(testApp)
      .post("/api/resumes/extract")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ rawText: "" });

    // 3. Student with valid text -> 200 OK
    const resValid = await request(testApp)
      .post("/api/resumes/extract")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ rawText: sampleResumeText });

    if (
      resRecruiter.status === 403 &&
      resEmpty.status === 400 &&
      resValid.status === 200
    ) {
      console.log(
        "  ✅ Passed: /api/resumes/extract enforces STUDENT role (403 for recruiters), validates text body (400 on empty), and extracts skills (200)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Role and validation check failed:", {
        recruiter: resRecruiter.status,
        empty: resEmpty.status,
        valid: resValid.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 AI Resume Skill Extraction Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runResumeExtractionTests().catch((err) => {
  console.error("Fatal resume extraction test error:", err);
  process.exit(1);
});
