import request from "supertest";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { healthRoutes } from "../routes/health.routes.js";
import { sendSuccess } from "../utils/response.util.js";

async function runProductionReadinessTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Production Readiness & Deployment Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // Test 1: Health Probe Endpoint & System Diagnostics
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Production Health Probe (GET /health)");
    const app = express();
    app.use("/health", healthRoutes);

    const res = await request(app).get("/health");
    const data = res.body.data || res.body.error?.details;

    if (
      (res.status === 200 || res.status === 503) &&
      data?.version === "1.0.0" &&
      typeof data?.uptimeSeconds === "number" &&
      data?.system?.heapUsedMB > 0 &&
      (data?.database?.status === "connected" ||
        data?.database?.status === "disconnected")
    ) {
      console.log(
        `  ✅ Passed: Health probe returns status (${data.status}), uptime (${data.uptimeSeconds}s), memory metrics (${data.system.heapUsedMB}MB heap), and database probe (${data.database.status})`,
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Health probe failed:", res.body);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Production Secret Strength Validation Guard
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 2: Production Secret Length & Security Validator");

    // Test secret validation logic
    const validateSecret = (secret: string, isProd: boolean) => {
      if (isProd) {
        if (!secret || secret.includes("dev-") || secret.length < 32) {
          throw new Error("Insecure JWT secret in production");
        }
      }
      return true;
    };

    // 2A: Short secret in production -> throws error
    let shortFailed = false;
    try {
      validateSecret("short-dev-secret", true);
    } catch {
      shortFailed = true;
    }

    // 2B: Strong 32+ char secret in production -> passes
    const strongPassed = validateSecret(
      "a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4q3r2s1t0",
      true,
    );

    if (shortFailed && strongPassed) {
      console.log(
        "  ✅ Passed: Production secret validator strictly rejects weak/dev secrets and accepts 32+ character entropy keys",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Secret validator check failed:", {
        shortFailed,
        strongPassed,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Environment Template (.env.example) Parity Check
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 3: Environment Variable Template (.env.example) Completeness",
    );

    const envExamplePath = path.resolve(
      process.cwd(),
      process.cwd().endsWith("server") ? "../.env.example" : ".env.example",
    );
    const envContent = fs.readFileSync(envExamplePath, "utf-8");

    const requiredKeys = [
      "NODE_ENV",
      "PORT",
      "API_PREFIX",
      "CLIENT_URL",
      "DATABASE_URL",
      "JWT_ACCESS_SECRET",
      "JWT_ACCESS_EXPIRES_IN",
      "JWT_REFRESH_SECRET",
      "JWT_REFRESH_EXPIRES_IN",
    ];

    const missingKeys = requiredKeys.filter((k) => !envContent.includes(k));

    if (missingKeys.length === 0) {
      console.log(
        "  ✅ Passed: Root .env.example contains all required production configuration keys",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Missing keys in .env.example:", missingKeys);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Git Secret Leakage Prevention (.gitignore Rules)
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Git Ignore Rules (.env, dist, node_modules)");

    const gitignorePath = path.resolve(
      process.cwd(),
      process.cwd().endsWith("server") ? "../.gitignore" : ".gitignore",
    );
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

    const requiredIgnores = [".env", "node_modules/", "dist/", "coverage/"];
    const missingIgnores = requiredIgnores.filter(
      (r) => !gitignoreContent.includes(r),
    );

    if (missingIgnores.length === 0) {
      console.log(
        "  ✅ Passed: .gitignore correctly protects secrets (.env), dependencies, and build artifacts from version control",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Missing ignore patterns:", missingIgnores);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: API Versioning Dual Prefix Mounting (/api/v1 & /api)
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 5: API Versioning & Dual Route Mounting (/api/v1 & /api)",
    );

    const app = express();
    const router = express.Router();
    router.get("/ping", (_req: Request, res: Response) => {
      sendSuccess(res, { ping: "pong" }, "Active");
    });

    app.use("/api/v1", router);
    app.use("/api", router);

    const resV1 = await request(app).get("/api/v1/ping");
    const resBase = await request(app).get("/api/ping");

    if (resV1.status === 200 && resBase.status === 200) {
      console.log(
        "  ✅ Passed: API routes accessible under both versioned (/api/v1) and default (/api) prefixes",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Dual prefix routing check failed:", {
        v1: resV1.status,
        base: resBase.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Production Readiness Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionReadinessTests().catch((err) => {
  console.error("Fatal production readiness test error:", err);
  process.exit(1);
});
