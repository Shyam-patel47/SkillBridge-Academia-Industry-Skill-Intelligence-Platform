# SkillBridge — Academia–Industry Skill Intelligence & Opportunity Platform

> **Source Inspiration**: SIH 26044 | **Project Scope**: Production-Grade Full-Stack Portfolio Application

---

## 📌 Project Overview

**SkillBridge** is a modern full-stack platform designed to systematically bridge the gap between academic competencies and industry hiring demand. Unlike typical job boards, SkillBridge provides:

1. **Standardized Skill Assessments** (Technical & Soft skills, 0–100 scoring)
2. **Deterministic Skill-Gap Benchmarking** against real-world career roles
3. **Curated Learning Roadmaps** prioritized by identified competency gaps
4. **Explainable Opportunity Matching** (Multi-factor weighted compatibility formula)
5. **Verified Student Portfolios** with verifiable skill evidence
6. **Institutional Analytics** comparing student talent supply against real-time industry demand

---

## 🏗️ Repository Architecture

```
SkillBridge/
├── client/                 # React 18 + Vite + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/     # Layout, UI & atomic components
│   │   ├── pages/          # View routes & page components
│   │   ├── routes/         # React Router v6 definitions
│   │   └── utils/          # Style helpers & utility methods
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/         # Environment variables & constants
│   │   ├── middleware/     # Error handlers, 404 handler, security
│   │   ├── routes/         # API route handlers (/api/v1/health, etc.)
│   │   ├── utils/          # Standard response envelopes
│   │   ├── app.ts          # Express application configuration
│   │   └── server.ts       # Server listener & bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/                 # Database schema & migrations
├── docs/                   # System design & architecture specifications
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

---

## 🛠️ Technology Stack

| Layer                | Technologies                                                            |
| -------------------- | ----------------------------------------------------------------------- |
| **Frontend**         | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide Icons |
| **Backend**          | Node.js, Express, TypeScript, Zod, Helmet, CORS, Morgan                 |
| **Database**         | PostgreSQL, Prisma ORM, NeonDB                                          |
| **State Management** | TanStack Query v5 (Server State), Zustand (Client/UI State)             |
| **Auth & Security**  | Custom JWT, Refresh Token Rotation, RBAC, Bcrypt                        |

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 2. Install Dependencies

Install all workspace dependencies from the root directory:

```bash
npm install
```

### 3. Setup Environment Variables

Create your local environment files:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

### 4. Run Development Servers

Start both the Express API and the Vite React frontend concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Endpoint**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 📜 Available NPM Scripts

| Command              | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `npm run dev`        | Runs both backend & frontend concurrently in development mode           |
| `npm run dev:server` | Runs only the Express backend with hot-reload (`tsx watch`)             |
| `npm run dev:client` | Runs only the Vite React frontend                                       |
| `npm run build`      | Builds both backend (TypeScript compilation) and frontend (Vite bundle) |
| `npm run lint`       | Runs ESLint across both server and client source trees                  |
| `npm run format`     | Runs Prettier across the codebase                                       |

---

## 🔒 Security & Standards

- All API responses follow a standardized JSON envelope (`{ success, data, message, error }`).
- Express is secured with HTTP security headers (`helmet`) and strictly origin-controlled CORS.
- Uncaught exceptions and Zod validation errors are handled cleanly by centralized middleware.
