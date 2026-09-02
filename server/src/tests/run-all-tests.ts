import { execSync } from "child_process";
import path from "path";

const testDir = path.resolve(
  process.cwd(),
  process.cwd().endsWith("server") ? "src/tests" : "server/src/tests",
);

const testSuites = [
  { name: "Authentication & RBAC", file: "auth.test.ts" },
  { name: "Student Profile & Academic Verification", file: "student.test.ts" },
  { name: "Skill Taxonomy & Category Management", file: "skill.test.ts" },
  { name: "Assessment Scoring & Question Engine", file: "assessment.test.ts" },
  {
    name: "Student Skill Profile & History Tracking",
    file: "student-skills.test.ts",
  },
  { name: "Career Role & Skill Gap Engine", file: "career-gap.test.ts" },
  {
    name: "Learning Recommendations & Priority Gaps",
    file: "learning-recommendations.test.ts",
  },
  {
    name: "Company & Opportunity Postings Management",
    file: "company-opportunities.test.ts",
  },
  {
    name: "Opportunity Discovery Feed & Compatibility",
    file: "opportunity-discovery.test.ts",
  },
  {
    name: "5-Factor Opportunity Matching Engine",
    file: "opportunity-matching-engine.test.ts",
  },
  {
    name: "Application Lifecycle & Pipeline Security",
    file: "application-lifecycle.test.ts",
  },
  {
    name: "Recruiter Candidate Ranking & Multi-Filters",
    file: "candidate-ranking.test.ts",
  },
  {
    name: "Student Digital Portfolio & Public URL",
    file: "digital-portfolio.test.ts",
  },
  {
    name: "Institution Demand vs Supply Analytics Engine",
    file: "institution-analytics.test.ts",
  },
  {
    name: "AI Resume Skill Extraction & Review Protocol",
    file: "resume-extraction.test.ts",
  },
  {
    name: "AI Job Description Parsing & Normalization",
    file: "jd-extraction.test.ts",
  },
  {
    name: "AI Career Explanation & Deterministic Immutability",
    file: "career-ai-explanation.test.ts",
  },
  {
    name: "Security Hardening & IDOR Isolation",
    file: "security-hardening.test.ts",
  },
  { name: "Cross-Module Integration Flows", file: "integration-flows.test.ts" },
  {
    name: "End-to-End Critical Workflow (Student & Recruiter)",
    file: "e2e-critical-workflow.test.ts",
  },
  {
    name: "OpenAPI 3.0 & Swagger UI Documentation",
    file: "api-docs.test.ts",
  },
  {
    name: "Performance Optimization & Pagination",
    file: "performance-optimization.test.ts",
  },
  {
    name: "Production Readiness & Health Probe",
    file: "production-readiness.test.ts",
  },
  {
    name: "Docker Containerization & CI/CD Pipeline",
    file: "docker-ci.test.ts",
  },
];

console.log(
  "🚀 =========================================================================",
);
console.log(
  "🚀 SkillBridge Master Test Runner — Executing Full Platform Test Suite",
);
console.log(
  "🚀 =========================================================================\n",
);

let suitesPassed = 0;
let suitesFailed = 0;
const results: Array<{
  name: string;
  status: "PASSED" | "FAILED";
  durationMs: number;
}> = [];

for (const suite of testSuites) {
  const filePath = path.join(testDir, suite.file);
  const startTime = Date.now();
  process.stdout.write(`⏳ Running [${suite.name}]... `);

  try {
    execSync(`npx tsx "${filePath}"`, { stdio: "pipe" });
    const duration = Date.now() - startTime;
    console.log(`✅ PASSED (${duration}ms)`);
    suitesPassed++;
    results.push({ name: suite.name, status: "PASSED", durationMs: duration });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.log(`❌ FAILED (${duration}ms)`);
    console.error(err.stdout?.toString() || err.message);
    suitesFailed++;
    results.push({ name: suite.name, status: "FAILED", durationMs: duration });
  }
}

console.log(
  "\n=========================================================================",
);
console.log(
  `📊 MASTER TEST RESULTS SUMMARY: ${suitesPassed}/${testSuites.length} Suites Passed (${suitesFailed} Failed)`,
);
console.log(
  "=========================================================================",
);

results.forEach((r, idx) => {
  const icon = r.status === "PASSED" ? "✅" : "❌";
  console.log(
    `${icon} ${(idx + 1).toString().padStart(2, "0")}. ${r.name.padEnd(55, ".")} ${r.status} (${r.durationMs}ms)`,
  );
});

console.log(
  "=========================================================================\n",
);

if (suitesFailed > 0) {
  process.exit(1);
} else {
  console.log(
    "🎉 ALL 20 TEST SUITES PASSED FLAWLESSLY WITH 100% SUCCESS RATE!\n",
  );
  process.exit(0);
}
