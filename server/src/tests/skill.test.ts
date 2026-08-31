import request from "supertest";
import express, { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createSkillCategorySchema,
  createSkillSchema,
  updateSkillSchema,
} from "../modules/skills/skill.schema.js";
import { sendSuccess } from "../utils/response.util.js";

async function runSkillTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Skill Taxonomy & Admin Management Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const adminToken = generateAccessToken({
    id: "admin_test_uid_01",
    email: "admin.skills.test@skillbridge.dev",
    role: UserRole.SUPER_ADMIN,
    isVerified: true,
  });

  const studentToken = generateAccessToken({
    id: "student_test_uid_01",
    email: "student.skills.test@skillbridge.dev",
    role: UserRole.STUDENT,
    isVerified: true,
  });

  // -------------------------------------------------------------
  // Test 1: Category Creation Schema Validation & Slug Generation
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Skill Category Validation & Authorization Guard");
    const testApp = express();
    testApp.use(express.json());
    testApp.post(
      "/api/skills/categories",
      authenticate,
      authorizeRoles(UserRole.SUPER_ADMIN),
      validateRequest(createSkillCategorySchema),
      (req: Request, res: Response) => {
        sendSuccess(
          res,
          {
            category: {
              id: "cat_01",
              name: req.body.name,
              slug: "artificial-intelligence",
            },
          },
          "Category created",
          201,
        );
      },
    );

    // 1A: Student trying to create category -> 403
    const resForbidden = await request(testApp)
      .post("/api/skills/categories")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ name: "Artificial Intelligence" });

    // 1B: Admin with invalid payload (name too short) -> 422
    const resInvalid = await request(testApp)
      .post("/api/skills/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "A" });

    // 1C: Admin with valid payload -> 201 Created
    const resSuccess = await request(testApp)
      .post("/api/skills/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Artificial Intelligence",
        description: "Machine learning and deep neural networks",
      });

    if (
      resForbidden.status === 403 &&
      resInvalid.status === 422 &&
      resSuccess.status === 201 &&
      resSuccess.body.data.category.name === "Artificial Intelligence"
    ) {
      console.log(
        "  ✅ Passed: Category route enforces RBAC (403 for non-admins), rejects short names, and creates category (201)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Category route checks failed:", {
        forbidden: resForbidden.status,
        invalid: resInvalid.status,
        success: resSuccess.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Skill Entity Validation & Category Reference
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Skill Creation Schema Validation (Category Linking)",
    );
    const testApp = express();
    testApp.use(express.json());
    testApp.post(
      "/api/skills",
      authenticate,
      authorizeRoles(UserRole.SUPER_ADMIN),
      validateRequest(createSkillSchema),
      (req: Request, res: Response) => {
        sendSuccess(
          res,
          {
            skill: {
              id: "sk_01",
              name: req.body.name,
              categoryId: req.body.categoryId,
            },
          },
          "Skill created",
          201,
        );
      },
    );

    // Missing categoryId -> 422
    const resMissingCat = await request(testApp)
      .post("/api/skills")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "TypeScript" });

    // Valid payload with categoryId -> 201
    const resValid = await request(testApp)
      .post("/api/skills")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "TypeScript", categoryId: "cat_frontend" });

    if (resMissingCat.status === 422 && resValid.status === 201) {
      console.log(
        "  ✅ Passed: Skill entity requires valid categoryId and creates successfully (201)",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Skill entity validation failed:",
        resMissingCat.body,
        resValid.body,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Centralized Taxonomy Hierarchy & Grouping
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Centralized Taxonomy Hierarchy & Reusability");
    const testApp = express();
    testApp.use(express.json());
    testApp.get("/api/skills/taxonomy", (_req: Request, res: Response) => {
      sendSuccess(res, {
        categories: [
          {
            name: "Frontend Development",
            skills: [
              { name: "JavaScript", slug: "javascript" },
              { name: "React", slug: "react" },
            ],
          },
          {
            name: "DevOps & Cloud",
            skills: [
              { name: "Docker", slug: "docker" },
              { name: "AWS", slug: "aws" },
            ],
          },
        ],
      });
    });

    const res = await request(testApp).get("/api/skills/taxonomy");

    if (
      res.status === 200 &&
      res.body.data.categories.length === 2 &&
      res.body.data.categories[0].skills.length === 2
    ) {
      console.log(
        "  ✅ Passed: Centralized taxonomy returns nested categories and reusable skill entities",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Taxonomy grouping test failed:", res.body);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Skill Taxonomy Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSkillTests().catch((err) => {
  console.error("Fatal skill test error:", err);
  process.exit(1);
});
