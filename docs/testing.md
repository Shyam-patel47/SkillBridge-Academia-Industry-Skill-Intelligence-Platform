# SkillBridge Comprehensive Testing Architecture & Strategy

## 1. Overview

SkillBridge enforces a rigorous **three-tier testing strategy** consisting of **Unit Tests**, **Cross-Module Integration Flows**, and **Multi-Role End-to-End Workflows** to guarantee 100% mathematical precision, RBAC authorization boundaries, and seamless application lifecycle transitions.

---

## 2. Test Suites Matrix (20 Automated Suites)

### Tier 1: Backend Unit Test Suites

1. **Authentication & RBAC** (`auth.test.ts`):
   - Bcrypt hashing with cost factor 12.
   - JWT access & refresh token lifecycle.
   - Zod validation and protected route guards.
   - RBAC tier authorization (`STUDENT`, `INDUSTRY`, `INSTITUTION_ADMIN`, `SUPER_ADMIN`).
2. **Student Profile** (`student.test.ts`):
   - Student authorization guard.
   - CGPA bounds (0.00 – 10.00), branch, and graduation year validation.
3. **Skill Taxonomy** (`skill.test.ts`):
   - Category CRUD, skill linking, hierarchy grouping, and super-admin protection.
4. **Assessment Scoring Engine** (`assessment.test.ts`):
   - Deterministic competency formula ($0 - 100\%$).
   - Correct answer stripping from student view (anti-cheating guard).
5. **Student Skill Profile & History** (`student-skills.test.ts`):
   - Categorized skills breakdown, verified vs unverified tracking, chronological score evolution.
6. **Career Role & Skill Gap Engine** (`career-gap.test.ts`):
   - Core skill weight multipliers ($1.5\times$).
   - Mathematical compatibility formula, deficit calculations, and readiness level tiers (`HIGH_FIT`, `MODERATE_FIT`, `DEVELOPING`).
7. **Learning Recommendations** (`learning-recommendations.test.ts`):
   - Deficit-driven ranking, deterministic explainability generation.
8. **Company Opportunities** (`company-opportunities.test.ts`):
   - Company profile RBAC, opportunity CRUD, multi-tenant recruiter isolation.
9. **Opportunity Discovery Feed** (`opportunity-discovery.test.ts`):
   - Feed filtering, student eligibility checks, real-time compatibility calculation.
10. **5-Factor Opportunity Matching Engine** (`opportunity-matching-engine.test.ts`):
    - Skill Compatibility (50%), Eligibility (20%), Career Interest (15%), Experience (10%), Location Preference (5%).
    - Normalized $0 - 100\%$ score with explainable matching/missing breakdowns.
11. **Application Lifecycle & Security** (`application-lifecycle.test.ts`):
    - Application submission, duplicate prevention, student isolation (403), recruiter isolation (403), pipeline transitions (`APPLIED` $\to$ `SHORTLISTED` $\to$ `INTERVIEW` $\to$ `OFFERED` $\to$ `REJECTED`), and withdrawal rules.
12. **Recruiter Candidate Ranking** (`candidate-ranking.test.ts`):
    - Descending score sorting, multi-dimensional filters (score, CGPA, branch, batch, skill), explainable deficit breakdowns.
13. **Digital Portfolio & Vanity URLs** (`digital-portfolio.test.ts`):
    - Projects CRUD, multi-tenant ownership guard (403), certifications/achievements validation, public vanity URL with view counter, public vs private visibility guard.
14. **Institution Demand vs Supply Analytics** (`institution-analytics.test.ts`):
    - Exact Demand vs Supply formula (Python 72% vs 61%, SQL 69% vs 48%, AWS 54% vs 31%, Docker 46% vs 24%), dean RBAC guard, application/placement funnel rates.
15. **AI Resume Skill Extraction** (`resume-extraction.test.ts`):
    - Provider abstraction, confidence scoring, taxonomy normalization, student review workflow saving unverified evidence (`isVerified: false`).
16. **AI Job Description Parsing** (`jd-extraction.test.ts`):
    - Role extraction, proficiency cutoffs, mandatory flags, recruiter review protocol.
17. **AI Career Explanation** (`career-ai-explanation.test.ts`):
    - Deterministic score immutability guard, natural language synthesis, key strengths & priority action, zero-crash fallback resilience.
18. **Security Hardening** (`security-hardening.test.ts`):
    - Helmet security headers (Frameguard DENY, NoSniff, Referrer-Policy, Hide Powered-By), database error sanitization (Prisma P2002/P2025/P2003), executable signature shield, path traversal sanitization, IDOR boundaries.

---

### Tier 2: Cross-Module Integration Flows (`integration-flows.test.ts`)

- **Flow 1: Authentication & Cryptographic Token Rotation**:
  - Registration $\to$ Login $\to$ Refresh Token Rotation $\to$ Replay attack prevention.
- **Flow 2: Assessment Session & Skills Profile Auto-Update**:
  - Start assessment $\to$ Evaluate answers $\to$ Auto-update `StudentSkills` database record and bump proficiency to verified.
- **Flow 3: Opportunity Creation & Benchmark Matrix Publishing**:
  - Recruiter setup $\to$ Create opportunity with required skills & weights $\to$ Publish to active feed.
- **Flow 4: Application Lifecycle & Pipeline Transitions**:
  - Student application submission $\to$ Recruiter pipeline progression (`APPLIED` $\to$ `SHORTLISTED` $\to$ `INTERVIEW` $\to$ `OFFERED`).

---

### Tier 3: Multi-Role End-to-End Critical Workflow (`e2e-critical-workflow.test.ts`)

Executes the full synchronized platform journey:

1. **Student Registration**: Registers Aarav Sharma (`STUDENT` role) and receives JWT access token.
2. **Student Profile**: Completes academic profile (CGPA 8.8, Computer Science & Engineering, Batch 2025).
3. **Assessment Submission**: Takes and submits React Benchmark Assessment (scores 100%, Advanced proficiency).
4. **Verified Skills Reflection**: Verified skill instantly updates in student skill profile with verified evidence badge.
5. **Career Gap Diagnostics**: Diagnoses compatibility against Full Stack Developer benchmark role (identifies missing Node.js & Docker).
6. **Recruiter Registration & Opportunity Posting**: CloudScale recruiter posts "Cloud Full Stack Intern" with React (mandatory) and Git benchmarks.
7. **Opportunity Discovery & Apply**: Student discovers opportunity and submits application (evaluates 74% compatibility score).
8. **Recruiter Evaluation & Shortlisting**: Recruiter inspects candidate ranking and transitions application status to `SHORTLISTED`.

---

## 3. How to Run Tests

```bash
# Run all 20 test suites via master test runner
npm test

# Run critical end-to-end workflow test
npm run test:e2e --workspace=server

# Run auth & security tests
npm run test:auth --workspace=server
```
