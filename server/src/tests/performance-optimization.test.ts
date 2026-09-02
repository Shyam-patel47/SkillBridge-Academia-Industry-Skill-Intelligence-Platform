import {
  getPaginationOptions,
  buildPaginatedResult,
} from "../utils/pagination.util.js";
import fs from "fs";
import path from "path";

async function runPerformanceOptimizationTests() {
  console.log("🧪 =======================================================");
  console.log("🧪 SkillBridge Performance & Pagination Test Suite");
  console.log("🧪 =======================================================\n");

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // Test 1: Reusable Pagination Math & Boundary Clamping
  // -------------------------------------------------------------
  try {
    console.log("▶ Test 1: Pagination Parser & Boundary Clamping");

    // 1A: Normal page request
    const p1 = getPaginationOptions({ page: 2, limit: 10 });
    // 1B: Negative / Zero bounds check
    const p2 = getPaginationOptions({ page: -5, limit: 0 }, 15);
    // 1C: Excessive limit clamping (max 100)
    const p3 = getPaginationOptions({ page: 1, limit: 500 });

    if (
      p1.page === 2 &&
      p1.limit === 10 &&
      p1.skip === 10 &&
      p2.page === 1 &&
      p2.limit === 15 &&
      p2.skip === 0 &&
      p3.page === 1 &&
      p3.limit === 100 &&
      p3.skip === 0
    ) {
      console.log(
        "  ✅ Passed: Pagination parameters correctly parsed, bounds validated, and clamped to max limit",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Pagination options check failed:", {
        p1,
        p2,
        p3,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 1 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Paginated Result Metadata (TotalPages, HasNext, HasPrev)
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 2: Paginated Result Structure & Page Boundaries");

    const mockItems = Array.from({ length: 45 }, (_, i) => ({
      id: `item_${i + 1}`,
    }));

    // Page 1 of 5 (10 items per page)
    const page1Res = buildPaginatedResult(mockItems.slice(0, 10), 45, 1, 10);
    // Page 5 of 5 (5 items on last page)
    const page5Res = buildPaginatedResult(mockItems.slice(40, 45), 45, 5, 10);

    if (
      page1Res.pagination.totalPages === 5 &&
      page1Res.pagination.hasNextPage === true &&
      page1Res.pagination.hasPrevPage === false &&
      page5Res.pagination.totalPages === 5 &&
      page5Res.pagination.hasNextPage === false &&
      page5Res.pagination.hasPrevPage === true
    ) {
      console.log(
        "  ✅ Passed: TotalPages, hasNextPage, and hasPrevPage computed accurately across pagination boundaries",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Pagination result metadata failed:", {
        page1: page1Res.pagination,
        page5: page5Res.pagination,
      });
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 2 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Candidate Ranking Ranked Pagination
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 3: Candidate Ranking Ordered Pagination (Descending Match Score)",
    );

    // Simulate 25 candidates with descending match scores
    const allCandidates = Array.from({ length: 25 }, (_, i) => ({
      id: `cand_${i + 1}`,
      matchScore: 98 - i * 2,
    }));

    const page2Opts = getPaginationOptions({ page: 2, limit: 10 });
    const page2Items = allCandidates.slice(
      page2Opts.skip,
      page2Opts.skip + page2Opts.limit,
    );
    const result = buildPaginatedResult(
      page2Items,
      allCandidates.length,
      page2Opts.page,
      page2Opts.limit,
    );

    if (
      result.items.length === 10 &&
      result.items[0].matchScore === 78 && // 98 - 10*2
      result.items[9].matchScore === 60 && // 98 - 19*2
      result.pagination.totalPages === 3 &&
      result.pagination.page === 2
    ) {
      console.log(
        "  ✅ Passed: Recruiter candidate ranking slice preserves match score order across pages",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Candidate ranking pagination failed:",
        result,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 3 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Database Schema Foreign Key Indexes Verification
  // -------------------------------------------------------------
  try {
    console.log(
      "\n▶ Test 4: Prisma Schema Indexing Audit (N+1 & Fast Lookups)",
    );

    const prismaPath = path.resolve(
      process.cwd(),
      process.cwd().endsWith("server")
        ? "prisma/schema.prisma"
        : "prisma/schema.prisma",
    );
    const schemaContent = fs.readFileSync(prismaPath, "utf-8");

    const expectedIndexes = [
      "@@index([studentId])",
      "@@index([opportunityId])",
      "@@index([userId])",
      "@@index([companyId])",
    ];

    const missingIndexes = expectedIndexes.filter(
      (idx) => !schemaContent.includes(idx),
    );

    if (missingIndexes.length === 0) {
      console.log(
        "  ✅ Passed: Relational models contain foreign key indexes for O(log n) joins and N+1 prevention",
      );
      passed++;
    } else {
      console.error(
        "  ❌ Failed: Missing indexes in Prisma schema:",
        missingIndexes,
      );
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 4 Exception:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test 5: Bundle Chunking & Optimization Config Verification
  // -------------------------------------------------------------
  try {
    console.log("\n▶ Test 5: Vite Bundle Code-Splitting & Vendor Chunking");

    const viteConfigPath = path.resolve(
      process.cwd(),
      process.cwd().endsWith("server")
        ? "../client/vite.config.ts"
        : "client/vite.config.ts",
    );
    const viteConfigContent = fs.readFileSync(viteConfigPath, "utf-8");

    if (
      viteConfigContent.includes("manualChunks") &&
      viteConfigContent.includes("react-vendor") &&
      viteConfigContent.includes("tanstack-vendor")
    ) {
      console.log(
        "  ✅ Passed: Client Vite configuration enforces vendor chunk splitting (react-vendor, tanstack-vendor)",
      );
      passed++;
    } else {
      console.error("  ❌ Failed: Vite configuration missing vendor chunking");
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Test 5 Exception:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(
    `📊 Performance & Pagination Test Summary: ${passed} Passed, ${failed} Failed`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPerformanceOptimizationTests().catch((err) => {
  console.error("Fatal performance test error:", err);
  process.exit(1);
});
