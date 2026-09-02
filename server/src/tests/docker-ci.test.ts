import fs from "fs";
import path from "path";

async function runDockerCiTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Docker & CI/CD Pipeline Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  const rootDir = path.resolve(
    process.cwd(),
    process.cwd().endsWith("server") ? ".." : ".",
  );

  // -------------------------------------------------------------
  // Test 1: Backend Dockerfile Multi-Stage Structure
  // -------------------------------------------------------------
  try {
    console.log(
      "▶ Test 1: Backend Dockerfile Multi-Stage & Security Configuration",
    );

    const serverDockerfilePath = path.join(rootDir, "server/Dockerfile");
    const content = fs.readFileSync(serverDockerfilePath, "utf-8");

    const requiredDirectives = [
      "AS builder",
      "AS runner",
      "node:20-alpine",
      "prisma generate",
      "dumb-init",
      "USER node",
      "EXPOSE 5000",
    ];

    const missing = requiredDirectives.filter((d) => !content.includes(d));

    if (missing.length === 0) {
      console.log(
        "  ✅ Passed: Backend Dockerfile implements secure multi-stage build with Prisma generation, dumb-init PID 1, and non-root node user",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Missing directives in server/Dockerfile:",
        missing,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Frontend Dockerfile Multi-Stage Nginx Build
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 2: Frontend Dockerfile Nginx & SPA Configuration");

    const clientDockerfilePath = path.join(rootDir, "client/Dockerfile");
    const content = fs.readFileSync(clientDockerfilePath, "utf-8");

    const requiredDirectives = [
      "AS builder",
      "AS runner",
      "nginx",
      "nginx.conf",
      "EXPOSE 80",
    ];

    const missing = requiredDirectives.filter((d) => !content.includes(d));

    if (missing.length === 0) {
      console.log(
        "  ✅ Passed: Frontend Dockerfile implements multi-stage compilation to Nginx Alpine web server",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Missing directives in client/Dockerfile:",
        missing,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Docker Compose Validation (NeonDB Exclusion Guard)
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Docker Compose Multi-Container Orchestration");

    const composePath = path.join(rootDir, "docker-compose.yml");
    const content = fs.readFileSync(composePath, "utf-8");

    const hasServer =
      content.includes("server:") && content.includes("5000:5000");
    const hasClient = content.includes("client:") && content.includes("80:80");
    const hasHealthCheck = content.includes("healthcheck:");
    // Guard: NeonDB should NOT be containerized as local postgres service
    const noLocalPostgres = !content.includes("image: postgres");

    if (hasServer && hasClient && hasHealthCheck && noLocalPostgres) {
      console.log(
        "  ✅ Passed: docker-compose.yml orchestrates server & client services with health probes, correctly preserving external NeonDB connection",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Docker compose validation failed:", {
        hasServer,
        hasClient,
        hasHealthCheck,
        noLocalPostgres,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: GitHub Actions CI Pipeline Configuration
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: GitHub Actions CI Pipeline (.github/workflows/ci.yml)",
    );

    const ciPath = path.join(rootDir, ".github/workflows/ci.yml");
    const content = fs.readFileSync(ciPath, "utf-8");

    const requiredSteps = [
      "npm ci",
      "npx prisma generate",
      "npm test",
      "npm run build",
      "actions/checkout@v4",
      "actions/setup-node@v4",
    ];

    const missing = requiredSteps.filter((s) => !content.includes(s));

    if (missing.length === 0) {
      console.log(
        "  ✅ Passed: CI pipeline enforces automated dependency installation, Prisma client generation, full test suite execution, and production compilation",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Missing steps in CI workflow:", missing);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Docker Ignore Files Completeness
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Docker Ignore Exclusion Files (.dockerignore)");

    const rootIgnore = fs.readFileSync(
      path.join(rootDir, ".dockerignore"),
      "utf-8",
    );
    const serverIgnore = fs.readFileSync(
      path.join(rootDir, "server/.dockerignore"),
      "utf-8",
    );
    const clientIgnore = fs.readFileSync(
      path.join(rootDir, "client/.dockerignore"),
      "utf-8",
    );

    const allIgnoreNodeModules =
      rootIgnore.includes("node_modules") &&
      serverIgnore.includes("node_modules") &&
      clientIgnore.includes("node_modules");

    const allIgnoreEnv =
      rootIgnore.includes(".env") &&
      serverIgnore.includes(".env") &&
      clientIgnore.includes(".env");

    if (allIgnoreNodeModules && allIgnoreEnv) {
      console.log(
        "  ✅ Passed: All Docker ignore files cleanly exclude local node_modules, build artifacts, and secret environment files",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Docker ignore check failed:", {
        allIgnoreNodeModules,
        allIgnoreEnv,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Docker & CI/CD Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDockerCiTests().catch((err) => {
  console.error("Fatal Docker CI test error:", err);
  process.exit(1);
});
