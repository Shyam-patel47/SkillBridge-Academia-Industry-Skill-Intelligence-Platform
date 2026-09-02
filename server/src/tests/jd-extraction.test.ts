import request from "supertest";
import express, { Request, Response } from "express";
import {
  UserRole,
  OpportunityType,
  WorkMode,
  ProficiencyLevel,
} from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { parseJobDescriptionSchema } from "../modules/opportunities/opportunity.schema.js";
import { JobDescriptionParserEngine } from "../modules/opportunities/jd-parser.engine.js";
import { sendSuccess } from "../utils/response.util.js";

async function runJdExtractionTests() {
  console.log("🧪 =======================================================");
  console.log(
    "🧪 SkillBridge AI Job Description Extraction & Normalization Tests",
  );
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const recruiterToken = generateAccessToken({
    id: "recruiter_user_01",
    email: "recruiter@techcorp.io",
    role: UserRole.INDUSTRY,
    isVerified: true,
  });

  const studentToken = generateAccessToken({
    id: "student_user_01",
    email: "student@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  const mockTaxonomy = [
    {
      id: "skill-react",
      name: "React",
      slug: "react",
      category: { name: "Frontend" },
    },
    {
      id: "skill-js",
      name: "JavaScript",
      slug: "javascript",
      category: { name: "Frontend" },
    },
    {
      id: "skill-git",
      name: "Git",
      slug: "git",
      category: { name: "DevOps & Tools" },
    },
    {
      id: "skill-rest",
      name: "RESTful APIs",
      slug: "restful-apis",
      category: { name: "Backend" },
    },
    {
      id: "skill-docker",
      name: "Docker",
      slug: "docker",
      category: { name: "Cloud & DevOps" },
    },
    {
      id: "skill-postgres",
      name: "PostgreSQL",
      slug: "postgresql",
      category: { name: "Database" },
    },
    {
      id: "skill-python",
      name: "Python",
      slug: "python",
      category: { name: "Backend" },
    },
    {
      id: "skill-aws",
      name: "Amazon Web Services",
      slug: "amazon-web-services",
      category: { name: "Cloud & DevOps" },
    },
  ];

  // -------------------------------------------------------------
  // Test 1: Exact User Example Requirement Extraction
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Exact User Example Requirement Extraction");
    const promptInput =
      "Looking for a React developer with JavaScript, Git and REST API experience.";

    const parsed = JobDescriptionParserEngine.parse(promptInput, mockTaxonomy);

    const skillNames = parsed.suggestedSkills.map((s) => s.skillName);

    if (
      skillNames.includes("React") &&
      skillNames.includes("JavaScript") &&
      skillNames.includes("Git") &&
      skillNames.includes("RESTful APIs")
    ) {
      console.log(
        "  ✅ Passed: Extracted exact expected skills: React, JavaScript, Git, RESTful APIs",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Extracted skills mismatch:", skillNames);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Skill Proficiency, Minimum Scores, and Mandatory Weights
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Skill Proficiency, Minimum Score Cutoffs, and Mandatory Flags",
    );
    const complexJd = `
      We are hiring a Senior Full Stack Engineer.
      Must have expert knowledge of React and Node.js with 3+ years experience.
      Solid understanding of Docker containerization and PostgreSQL relational databases.
      Nice to have: Basic familiarity with Python.
    `;

    const taxonomyWithNode = [
      ...mockTaxonomy,
      {
        id: "skill-node",
        name: "Node.js",
        slug: "node-js",
        category: { name: "Backend" },
      },
    ];

    const parsed = JobDescriptionParserEngine.parse(
      complexJd,
      taxonomyWithNode,
    );

    const react = parsed.suggestedSkills.find((s) => s.skillName === "React");
    const python = parsed.suggestedSkills.find((s) => s.skillName === "Python");
    const docker = parsed.suggestedSkills.find((s) => s.skillName === "Docker");

    if (
      react?.proficiency === ProficiencyLevel.ADVANCED &&
      react?.minScore === 75.0 &&
      react?.isMandatory === true &&
      python?.proficiency === ProficiencyLevel.BEGINNER &&
      python?.minScore === 50.0 &&
      python?.isMandatory === false &&
      docker?.isMandatory === true
    ) {
      console.log(
        "  ✅ Passed: Proficiency inference and mandatory weights calibrated correctly (React: ADVANCED/75pt/Mandatory, Python: BEGINNER/50pt/Optional)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Proficiency/weight check failed:", {
        react,
        python,
        docker,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Inferred Role Title, Type, WorkMode, & Eligibility Criteria
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 3: Inferred Role Title, Type, WorkMode, & Eligibility Criteria",
    );
    const internshipJd = `
      We are looking for a Summer Cloud DevOps Intern.
      Work mode: Remote. Duration: 3 Months.
      Eligibility: B.Tech Computer Science & Information Technology students from 2025 and 2026 batches with CGPA >= 7.5.
      Requirements: AWS, Docker, Kubernetes, and Git.
    `;

    const parsed = JobDescriptionParserEngine.parse(internshipJd, mockTaxonomy);

    if (
      parsed.suggestedType === OpportunityType.INTERNSHIP &&
      parsed.suggestedWorkMode === WorkMode.REMOTE &&
      parsed.suggestedDuration === "3 Months" &&
      parsed.suggestedMinCgpa === 7.5 &&
      parsed.suggestedEligibleBranches.includes(
        "Computer Science & Engineering",
      ) &&
      parsed.suggestedEligibleBranches.includes("Information Technology") &&
      parsed.suggestedEligibleGradYears.includes(2025) &&
      parsed.suggestedEligibleGradYears.includes(2026)
    ) {
      console.log(
        "  ✅ Passed: Inferred Type (INTERNSHIP), WorkMode (REMOTE), Duration (3 Months), CGPA (7.5), Branches (CSE/IT), and Batch Years (2025/2026)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Metadata inference failed:", parsed);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Taxonomy Normalization & ID Mapping Integrity
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: Taxonomy Normalization & Database ID Mapping Integrity",
    );
    const sampleJd =
      "Looking for Postgres and AWS specialists with Git version control.";

    const parsed = JobDescriptionParserEngine.parse(sampleJd, mockTaxonomy);

    const postgres = parsed.suggestedSkills.find(
      (s) => s.skillName === "PostgreSQL",
    );
    const aws = parsed.suggestedSkills.find(
      (s) => s.skillName === "Amazon Web Services",
    );
    const git = parsed.suggestedSkills.find((s) => s.skillName === "Git");

    if (
      postgres?.skillId === "skill-postgres" &&
      aws?.skillId === "skill-aws" &&
      git?.skillId === "skill-git"
    ) {
      console.log(
        "  ✅ Passed: All alias and synonym matches mapped to valid database taxonomy skill IDs",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Taxonomy ID mapping failed:", {
        postgres,
        aws,
        git,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Role Guard & Recruiter Review Enforcement
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 5: Role Authorization Guard (INDUSTRY) & Review Protocol",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
      "/api/opportunities/parse-jd",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      validateRequest(parseJobDescriptionSchema),
      (req: Request, res: Response) => {
        const parsed = JobDescriptionParserEngine.parse(
          req.body.jobDescription,
          mockTaxonomy,
        );
        sendSuccess(res, { parsed }, "Parsed", 200);
      },
    );

    // 1. Recruiter access -> 200 OK
    const resRecruiter = await request(testApp)
      .post("/api/opportunities/parse-jd")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        jobDescription:
          "Looking for a React developer with JavaScript, Git and REST API experience.",
      });

    // 2. Student access -> 403 Forbidden
    const resStudent = await request(testApp)
      .post("/api/opportunities/parse-jd")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        jobDescription:
          "Looking for a React developer with JavaScript, Git and REST API experience.",
      });

    // 3. Empty input -> 422 Unprocessable Entity
    const resEmpty = await request(testApp)
      .post("/api/opportunities/parse-jd")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ jobDescription: "short" }); // under 10 chars

    if (
      resRecruiter.status === 200 &&
      resStudent.status === 403 &&
      resEmpty.status === 422
    ) {
      console.log(
        "  ✅ Passed: /api/opportunities/parse-jd strictly enforces INDUSTRY role (403 for students), validates input length (422), and returns suggestions (200)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Role guard and validation failed:", {
        recruiter: resRecruiter.status,
        student: resStudent.status,
        empty: resEmpty.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 AI Job Description Extraction Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runJdExtractionTests().catch((err) => {
  console.error("Fatal JD extraction test error:", err);
  process.exit(1);
});
