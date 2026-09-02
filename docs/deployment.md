# SkillBridge Production Deployment & Operations Guide

## 1. Overview

SkillBridge is architected for frictionless, scalable production deployment across modern cloud platforms (Render, Railway, Fly.io, AWS ECS, or Vercel).

---

## 2. Environment Configuration

Copy the production environment template:

```bash
cp .env.example .env
```

Ensure the following variables are configured with production values:

```env
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
CLIENT_URL=https://skillbridge.dev

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Minimum 32-character high-entropy cryptographic keys
JWT_ACCESS_SECRET="generate-a-strong-32-character-secret-key-for-access-token"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET="generate-a-strong-32-character-secret-key-for-refresh-token"
JWT_REFRESH_EXPIRES_IN=7d

# Google Gemini API key (optional — system automatically falls back to offline NLP engine if omitted)
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 3. Production Build & Migration Procedure

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Apply Database Schema & Migrations

```bash
# Push schema changes to production PostgreSQL/NeonDB database
npm run prisma:push --workspace=server

# Or deploy migration history
npm run prisma:migrate --workspace=server

# Seed benchmark taxonomy and default roles
npm run prisma:seed --workspace=server
```

### Step 3: Compile Production Bundles

```bash
# Builds both TypeScript server (dist/server.js) and optimized React client (dist/)
npm run build
```

### Step 4: Execute Test Suite Verification

```bash
# Executes all 23 platform test suites
npm test
```

### Step 5: Start Production Server

```bash
npm start
```

---

## 4. Production Health & Diagnostics

- **Live Health Probe**: `GET /api/v1/health`
  - Returns database connection latency, system uptime, and memory heap utilization.
- **OpenAPI 3.0 Documentation**: `GET /api/v1/docs`
  - Serves the live interactive Swagger UI dashboard.
- **Graceful Shutdown**:
  - The server traps `SIGTERM` and `SIGINT`, cleanly closes open HTTP sockets, and disconnects the Prisma database pool.
