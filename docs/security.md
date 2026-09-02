# SkillBridge Security Architecture & Hardening Guide

## 1. Executive Summary

SkillBridge is designed with **defense-in-depth principles**, guaranteeing privacy, multi-tenant isolation, data integrity, and resilience against common OWASP Top 10 vulnerabilities.

---

## 2. Authentication & Credential Security

- **Password Storage**: Passwords are cryptographically hashed using **Bcrypt with cost factor 12** and per-user salt. Raw passwords are never stored or logged.
- **JWT Architecture**:
  - **Access Tokens**: Short-lived (15 minutes), signed with `HS256`, containing only identity metadata (`id`, `email`, `role`, `isVerified`).
  - **Refresh Tokens**: Long-lived (7 days), stored in secure storage / HTTPOnly cookies, with rotation on refresh.
  - **Production Secret Validation**: In production (`NODE_ENV === 'production'`), startup throws a fatal error if secrets are `< 32` characters or use default development fallback strings.
- **Sensitive Entity Sanitization**: User serialization across all Prisma queries explicitly selects safe fields (`id`, `email`, `role`, `isVerified`, `createdAt`) and excludes `passwordHash`.

---

## 3. Authorization & Multi-Tenant Boundaries

- **Role-Based Access Control (RBAC)**:
  - Strict role middleware (`authorizeRoles`) enforces access across 4 distinct tiers: `STUDENT`, `INDUSTRY`, `INSTITUTION_ADMIN`, `SUPER_ADMIN`.
- **Insecure Direct Object Reference (IDOR) Defense**:
  - Every resource endpoint checks that the requesting entity owns the record or has super-admin privileges.
  - Students cannot view or modify other students' assessments, portfolios, or applications.
  - Recruiters cannot manage vacancies or applicants belonging to competing companies.

---

## 4. Input & API Validation

- **Zod Schema Enforced**: Every API endpoint validates `body`, `params`, and `query` using Zod schemas before reaching business logic controllers.
- **SQL Injection Prevention**: All database access is parameterized through Prisma ORM with strict type mapping.
- **JSON Payload Sizing**: Global body parsers limit request bodies to **5MB** to prevent denial-of-service memory exhaustion attacks.

---

## 5. HTTP Security Headers & Network Defense

- **Helmet Middleware Suite**:
  - **X-Frame-Options: DENY**: Anti-clickjacking defense.
  - **X-Content-Type-Options: nosniff**: MIME sniffing prevention.
  - **X-Powered-By**: Header stripped to prevent server fingerprinting.
  - **HSTS (HTTP Strict Transport Security)**: Enforced in production (`maxAge: 31536000`, includeSubDomains, preload).
  - **Content Security Policy (CSP)**: Explicit origin whitelists for scripts, styles, fonts, and Google Gemini API endpoints.
- **CORS Configuration**: Explicit origin whitelist with credential isolation and preflight caching.

---

## 6. Multi-Tier Rate Limiting

- **Authentication Limiter (`/api/v1/auth/*`)**: Max 30 attempts per 15-minute window per IP to stop credential stuffing and brute-force attacks.
- **AI Processing Limiter (`/resumes/extract`, `/opportunities/parse-jd`)**: Max 20 requests per minute per IP to prevent compute exhaustion.
- **Global API Limiter**: Max 1000 requests per 15-minute window per IP.

---

## 7. File Upload & Processing Security

- **In-Memory Storage**: Multer processes uploads via `memoryStorage` (no raw unencrypted files persisted to disk).
- **Strict 5MB Size Cap**: Enforced by Multer and application middleware.
- **Filename Sanitization**: Automatically strips `../`, directory traversal tokens, and control characters.
- **Binary Signature Shield**: Validates magic numbers (`%PDF-` for PDFs, checks for malicious Windows `MZ` or Linux `ELF` executable headers).

---

## 8. Information Leakage & Error Sanitization

- **Prisma Error Interceptor**: Prisma database errors (`P2002`, `P2025`, `P2003`) are intercepted and translated into clean, client-safe error messages without exposing table schemas, column names, or raw SQL queries.
- **Stack Trace Suppression**: Full stack traces are restricted to local development mode and suppressed in staging and production.
