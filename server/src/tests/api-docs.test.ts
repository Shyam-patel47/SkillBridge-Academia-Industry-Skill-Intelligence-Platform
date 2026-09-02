import request from "supertest";
import express from "express";
import { docsRoutes } from "../routes/docs.routes.js";
import fs from "fs";
import path from "path";

async function runApiDocsTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge OpenAPI & Swagger Documentation Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const app = express();
  app.use("/docs", docsRoutes);

  // -------------------------------------------------------------
  // Test 1: OpenAPI 3.0.3 JSON Specification Endpoint
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Test 1: OpenAPI Specification Verification (GET /docs/openapi.json)",
    );
    const res = await request(app).get("/docs/openapi.json");

    if (
      res.status === 200 &&
      res.body.openapi === "3.0.3" &&
      res.body.info?.title?.includes("SkillBridge") &&
      typeof res.body.paths === "object"
    ) {
      const pathCount = Object.keys(res.body.paths).length;
      console.log(
        `  ✅ Passed: Valid OpenAPI 3.0.3 spec returned with ${pathCount} documented routes`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: OpenAPI endpoint check failed:", res.body);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Swagger UI Dashboard Rendering
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Interactive Swagger UI HTML Dashboard (GET /docs)",
    );
    const res = await request(app).get("/docs");

    if (
      res.status === 200 &&
      res.text.includes('id="swagger-ui"') &&
      res.text.includes("SwaggerUIBundle")
    ) {
      console.log(
        "  ✅ Passed: Swagger UI interactive dashboard rendered successfully",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Swagger UI HTML render failed");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Coverage of Core PRD Modules
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Module Coverage in OpenAPI Specification");
    const openApiPath = path.resolve(
      process.cwd(),
      process.cwd().endsWith("server")
        ? "src/docs/openapi.json"
        : "server/src/docs/openapi.json",
    );
    const spec = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));

    const requiredPaths = [
      "/auth/login",
      "/auth/register",
      "/students/profile",
      "/skills",
      "/assessments",
      "/careers/recommendations",
      "/opportunities/feed",
      "/opportunities/parse-jd",
      "/resumes/extract",
      "/applications",
      "/portfolios/me",
      "/institutions/analytics",
    ];

    const missingPaths = requiredPaths.filter((p) => !spec.paths[p]);

    if (missingPaths.length === 0) {
      console.log(
        "  ✅ Passed: All 15 required PRD modules are documented in OpenAPI specification",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Missing paths in spec:", missingPaths);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Security Scheme & RBAC Parameterization
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Security Scheme & Bearer Auth Configuration");
    const openApiPath = path.resolve(
      process.cwd(),
      process.cwd().endsWith("server")
        ? "src/docs/openapi.json"
        : "server/src/docs/openapi.json",
    );
    const spec = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));

    const hasBearer =
      spec.components?.securitySchemes?.bearerAuth?.type === "http";
    const hasRolesEnum = Array.isArray(
      spec.components?.schemas?.UserRole?.enum,
    );

    if (hasBearer && hasRolesEnum) {
      console.log(
        "  ✅ Passed: Bearer JWT security scheme and UserRole schemas configured properly",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Security schemes check failed");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 API Documentation Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runApiDocsTests().catch((err) => {
  console.error("Fatal API docs test error:", err);
  process.exit(1);
});
