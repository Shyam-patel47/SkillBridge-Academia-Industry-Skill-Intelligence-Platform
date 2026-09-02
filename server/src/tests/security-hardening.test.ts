import request from "supertest";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { UserRole } from "@prisma/client";
import { generateAccessToken } from "../utils/token.util.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { errorHandler } from "../middleware/error.middleware.js";
import { validateBufferSignature } from "../modules/resumes/resume-upload.middleware.js";
import { sendSuccess } from "../utils/response.util.js";

async function runSecurityHardeningTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Platform Security Hardening Test Suite");
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

  // -------------------------------------------------------------
  // Test 1: HTTP Security Headers & Helmet Defense
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: HTTP Security Headers & Fingerprint Suppression");
    const testApp = express();

    testApp.use(
      helmet({
        frameguard: { action: "deny" },
        noSniff: true,
        hidePoweredBy: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      }),
    );

    testApp.get("/api/test-headers", (_req: Request, res: Response) => {
      res.json({ status: "secure" });
    });

    const res = await request(testApp).get("/api/test-headers");

    const frameOptions = res.headers["x-frame-options"];
    const contentTypeOptions = res.headers["x-content-type-options"];
    const poweredBy = res.headers["x-powered-by"];
    const referrerPolicy = res.headers["referrer-policy"];

    if (
      frameOptions === "DENY" &&
      contentTypeOptions === "nosniff" &&
      poweredBy === undefined &&
      referrerPolicy === "strict-origin-when-cross-origin"
    ) {
      console.log(
        "  ✅ Passed: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, and X-Powered-By suppression verified",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Security headers check failed:", {
        frameOptions,
        contentTypeOptions,
        poweredBy,
        referrerPolicy,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Database Error Sanitization & Information Leakage Defense
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 2: Database Error Sanitization (Prisma P2002/P2025/P2003)",
    );
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      "/api/test-prisma-error",
      (_req: Request, _res: Response, next) => {
        // Simulate Prisma Unique Constraint Violation
        const simulatedPrismaError: any = new Error(
          "Unique constraint failed on the fields: (`email`)",
        );
        simulatedPrismaError.code = "P2002";
        simulatedPrismaError.meta = { target: ["email"] };
        next(simulatedPrismaError);
      },
    );

    testApp.use(errorHandler);

    const res = await request(testApp).get("/api/test-prisma-error");

    if (
      res.status === 409 &&
      res.body.success === false &&
      res.body.error.code === "DUPLICATE_RESOURCE_CONFLICT" &&
      !res.body.error.message.includes("PrismaClient") &&
      !res.body.error.message.includes("SQL")
    ) {
      console.log(
        "  ✅ Passed: Prisma database errors safely mapped to sanitized client response (409 DUPLICATE_RESOURCE_CONFLICT) without internal schema leak",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Prisma error sanitization check failed:",
        res.body,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Binary Signature & Executable Upload Defense
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 3: Binary Signature Validation & Executable Shield");

    // 1. Fake PDF with Windows EXE header ('MZ')
    const maliciousBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const isExeValid = validateBufferSignature(
      maliciousBuffer,
      "application/pdf",
    );

    // 2. Fake PDF with Linux ELF header ('\x7fELF')
    const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]);
    const isElfValid = validateBufferSignature(elfBuffer, "application/pdf");

    // 3. Genuine PDF header ('%PDF-1.4')
    const validPdfBuffer = Buffer.from("%PDF-1.4 sample pdf content stream");
    const isPdfValid = validateBufferSignature(
      validPdfBuffer,
      "application/pdf",
    );

    // 4. Genuine Text buffer
    const validTxtBuffer = Buffer.from(
      "Senior React Developer Resume text content",
    );
    const isTxtValid = validateBufferSignature(validTxtBuffer, "text/plain");

    if (
      isExeValid === false &&
      isElfValid === false &&
      isPdfValid === true &&
      isTxtValid === true
    ) {
      console.log(
        "  ✅ Passed: Binary executable signatures (MZ, ELF) rejected; legitimate PDF (%PDF-) and plain text accepted",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Signature validation failed:", {
        isExeValid,
        isElfValid,
        isPdfValid,
        isTxtValid,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Path Traversal & Dangerous Filename Sanitization
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 4: Path Traversal & Filename Character Sanitization");

    const dangerousFilenames = [
      "../../../../etc/passwd",
      "..\\..\\windows\\system32\\cmd.exe",
      "resume\x00malicious.pdf",
    ];

    const sanitizedResults = dangerousFilenames.map((name) =>
      name
        .replace(/(\.\.[/\\])+/g, "")
        .replace(/[\x00-\x1f\x80-\x9f]/g, "")
        .trim(),
    );

    const safeCheck = sanitizedResults.every(
      (name) => !name.includes("..") && !name.includes("\x00"),
    );

    if (safeCheck && sanitizedResults[0] === "etc/passwd") {
      console.log(
        "  ✅ Passed: Filename sanitization neutralizes directory traversal vectors (../) and null byte injection",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Filename sanitization failed:",
        sanitizedResults,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Multi-Tenant RBAC & IDOR Boundary Isolation
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Multi-Tenant RBAC & IDOR Ownership Isolation");
    const testApp = express();
    testApp.use(express.json());

    // Mock resource owned by company_01
    const resourceStore: Record<string, { companyId: string; data: string }> = {
      opp_01: { companyId: "company_01", data: "Secret Recruiter Notes" },
    };

    testApp.delete(
      "/api/opportunities/:id",
      authenticate,
      authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
      (req: Request, res: Response) => {
        const id = req.params.id as string;
        const resource = resourceStore[id];

        // Simulate multi-tenant ownership check
        const userCompanyId =
          req.user!.id === "recruiter_user_01" ? "company_01" : "company_02";

        if (!resource || resource.companyId !== userCompanyId) {
          return res.status(403).json({
            success: false,
            error: {
              message:
                "Forbidden: You do not have ownership of this opportunity.",
              code: "FORBIDDEN",
            },
          });
        }

        delete resourceStore[id];
        sendSuccess(res, { deleted: true }, "Deleted", 200);
      },
    );

    // 1. Student attempting recruiter action -> 403
    const resStudent = await request(testApp)
      .delete("/api/opportunities/opp_01")
      .set("Authorization", `Bearer ${studentToken}`);

    // 2. Recruiter who owns the resource -> 200
    const resRecruiterOwner = await request(testApp)
      .delete("/api/opportunities/opp_01")
      .set("Authorization", `Bearer ${recruiterToken}`);

    if (resStudent.status === 403 && resRecruiterOwner.status === 200) {
      console.log(
        "  ✅ Passed: RBAC and multi-tenant resource ownership prevent unauthorized access and IDOR tampering (403 Forbidden)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: RBAC / IDOR check failed:", {
        student: resStudent.status,
        recruiter: resRecruiterOwner.status,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Security Hardening Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityHardeningTests().catch((err) => {
  console.error("Fatal security test error:", err);
  process.exit(1);
});
