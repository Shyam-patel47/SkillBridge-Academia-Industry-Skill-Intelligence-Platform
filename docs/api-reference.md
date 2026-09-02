# SkillBridge REST API Reference & Specification

## 1. Overview

The SkillBridge REST API powers the Academia-Industry Skill Intelligence & Opportunity Matching Platform.

- **Base URL**: `http://localhost:5000/api/v1` (or `/api`)
- **Interactive Swagger UI**: `http://localhost:5000/api/v1/docs` (or `/docs`)
- **OpenAPI 3.0.3 Spec**: `http://localhost:5000/api/v1/docs/openapi.json`
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 2. Global Response Formats

### Success Response (200 / 201)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... }
}
```

### Error Response (400 / 401 / 403 / 404 / 409 / 422 / 429 / 500)

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE_STRING",
    "details": []
  }
}
```

---

## 3. Endpoints by Module

### 🔐 1. Authentication (`/auth`)

| Method | Endpoint         | Auth   | Role   | Description                                                       |
| ------ | ---------------- | ------ | ------ | ----------------------------------------------------------------- |
| `POST` | `/auth/register` | None   | Public | Register new user account with initial role profile               |
| `POST` | `/auth/login`    | None   | Public | Authenticate email/password & receive JWT access + refresh tokens |
| `POST` | `/auth/refresh`  | None   | Public | Cryptographically rotate refresh token & get new access token     |
| `GET`  | `/auth/me`       | Bearer | Any    | Get authenticated user identity payload                           |
| `POST` | `/auth/logout`   | Bearer | Any    | Invalidate refresh token                                          |

---

### 🎓 2. Students & Profile (`/students`)

| Method | Endpoint                   | Auth   | Role      | Description                                            |
| ------ | -------------------------- | ------ | --------- | ------------------------------------------------------ |
| `GET`  | `/students/profile`        | Bearer | `STUDENT` | Get authenticated student academic profile             |
| `PUT`  | `/students/profile`        | Bearer | `STUDENT` | Update CGPA, branch, graduation year, bio & interests  |
| `GET`  | `/students/skills/summary` | Bearer | `STUDENT` | Get categorized verified vs self-reported skill scores |

---

### 🏷️ 3. Skill Taxonomy (`/skills`)

| Method | Endpoint             | Auth   | Role          | Description                                      |
| ------ | -------------------- | ------ | ------------- | ------------------------------------------------ |
| `GET`  | `/skills`            | None   | Public        | List all standardized skills grouped by category |
| `GET`  | `/skills/categories` | None   | Public        | List all skill categories                        |
| `POST` | `/skills/categories` | Bearer | `SUPER_ADMIN` | Create new taxonomy category                     |
| `POST` | `/skills`            | Bearer | `SUPER_ADMIN` | Create standardized skill entity                 |

---

### 📝 4. Assessment Engine (`/assessments`)

| Method | Endpoint                   | Auth   | Role      | Description                                                     |
| ------ | -------------------------- | ------ | --------- | --------------------------------------------------------------- |
| `GET`  | `/assessments`             | Bearer | `STUDENT` | List available skill assessments catalog                        |
| `GET`  | `/assessments/:id/session` | Bearer | `STUDENT` | Start assessment session with sanitized answer options          |
| `POST` | `/assessments/:id/submit`  | Bearer | `STUDENT` | Submit answers, calculate score, and auto-update verified skill |
| `GET`  | `/assessments/results/:id` | Bearer | `STUDENT` | Get detailed assessment result breakdown                        |

---

### 🧭 5. Career Intelligence & Skill Gap (`/careers`)

| Method | Endpoint                    | Auth   | Role      | Description                                              |
| ------ | --------------------------- | ------ | --------- | -------------------------------------------------------- |
| `GET`  | `/careers`                  | None   | Public    | List industry career roles and benchmark requirements    |
| `GET`  | `/careers/recommendations`  | Bearer | `STUDENT` | Personalized career recommendations with AI explanations |
| `GET`  | `/careers/:id/gap-analysis` | Bearer | `STUDENT` | Diagnose mathematical skill deficits & readiness tiers   |

---

### 📚 6. Learning Recommendations (`/learning`)

| Method | Endpoint                    | Auth   | Role      | Description                                         |
| ------ | --------------------------- | ------ | --------- | --------------------------------------------------- |
| `GET`  | `/learning/recommendations` | Bearer | `STUDENT` | Deficit-prioritized courses, resources, and modules |

---

### 🏢 7. Companies & Recruiter Portal (`/companies`)

| Method | Endpoint             | Auth   | Role       | Description                                        |
| ------ | -------------------- | ------ | ---------- | -------------------------------------------------- |
| `GET`  | `/companies/profile` | Bearer | `INDUSTRY` | Get recruiter company profile                      |
| `PUT`  | `/companies/profile` | Bearer | `INDUSTRY` | Update company branding, industry, and description |

---

### 💼 8. Opportunities & Matching (`/opportunities`)

| Method | Endpoint                   | Auth   | Role       | Description                                                      |
| ------ | -------------------------- | ------ | ---------- | ---------------------------------------------------------------- |
| `GET`  | `/opportunities`           | Bearer | `INDUSTRY` | List vacancies posted by authenticated recruiter                 |
| `POST` | `/opportunities`           | Bearer | `INDUSTRY` | Create vacancy with required skill benchmarks and weights        |
| `GET`  | `/opportunities/feed`      | Bearer | `STUDENT`  | Opportunity discovery feed with real-time 5-factor match scoring |
| `GET`  | `/opportunities/:id`       | Bearer | Any        | Get opportunity details                                          |
| `GET`  | `/opportunities/:id/match` | Bearer | `STUDENT`  | Get detailed 5-factor match score breakdown                      |
| `POST` | `/opportunities/parse-jd`  | Bearer | `INDUSTRY` | AI job description parser and requirement extractor              |

---

### 📄 9. Application Lifecycle & Ranking (`/applications`)

| Method  | Endpoint                                   | Auth   | Role       | Description                                                          |
| ------- | ------------------------------------------ | ------ | ---------- | -------------------------------------------------------------------- |
| `GET`   | `/applications`                            | Bearer | `STUDENT`  | List student submitted applications                                  |
| `POST`  | `/applications`                            | Bearer | `STUDENT`  | Submit application to vacancy with match score snapshot              |
| `POST`  | `/applications/:id/withdraw`               | Bearer | `STUDENT`  | Withdraw active application                                          |
| `GET`   | `/applications/opportunity/:id/candidates` | Bearer | `INDUSTRY` | Candidate ranking in descending match score order                    |
| `PATCH` | `/applications/:id/status`                 | Bearer | `INDUSTRY` | Advance pipeline (`SHORTLISTED`, `INTERVIEW`, `OFFERED`, `REJECTED`) |

---

### 🎨 10. Digital Portfolio (`/portfolios`)

| Method   | Endpoint                   | Auth   | Role      | Description                                |
| -------- | -------------------------- | ------ | --------- | ------------------------------------------ |
| `GET`    | `/portfolios/me`           | Bearer | `STUDENT` | Get student portfolio studio data          |
| `PUT`    | `/portfolios/visibility`   | Bearer | `STUDENT` | Toggle public/private portfolio visibility |
| `POST`   | `/portfolios/projects`     | Bearer | `STUDENT` | Add project to portfolio                   |
| `DELETE` | `/portfolios/projects/:id` | Bearer | `STUDENT` | Delete portfolio project                   |
| `GET`    | `/portfolios/public/:slug` | None   | Public    | View public portfolio vanity URL           |

---

### 🤖 11. AI Resume Assistance (`/resumes`)

| Method | Endpoint                  | Auth   | Role      | Description                                                        |
| ------ | ------------------------- | ------ | --------- | ------------------------------------------------------------------ |
| `POST` | `/resumes/extract`        | Bearer | `STUDENT` | AI resume skill extractor with confidence score and review cockpit |
| `POST` | `/resumes/confirm-skills` | Bearer | `STUDENT` | Save reviewed skills as unverified self-reported evidence          |

---

### 📊 12. Institution Analytics (`/institutions`)

| Method | Endpoint                  | Auth   | Role                               | Description                                                                              |
| ------ | ------------------------- | ------ | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/institutions/analytics` | Bearer | `INSTITUTION_ADMIN`, `SUPER_ADMIN` | Aggregate Industry Demand vs Student Supply Matrix, placement funnels, and interventions |
