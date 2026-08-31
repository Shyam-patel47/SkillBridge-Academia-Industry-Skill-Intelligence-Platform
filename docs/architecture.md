# SkillBridge Architecture Documentation

## Overview

SkillBridge connects academia and industry by assessing student competencies, identifying skill gaps against industry benchmarks, generating explainable recommendations, and matching candidates with verified job and internship opportunities.

## System Topology

```
                  ┌───────────────────────────────┐
                  │       SkillBridge Client      │
                  │   (React + Vite + Tailwind)   │
                  └───────────────┬───────────────┘
                                  │
                             HTTP / JSON
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │       SkillBridge Server      │
                  │   (Express + TypeScript API)  │
                  └───────────────┬───────────────┘
                                  │
                             Prisma ORM
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │      PostgreSQL (NeonDB)      │
                  └───────────────────────────────┘
```

## Modular Directory Layout

- `client/`: Single-Page Application (SPA) powered by React 18/19, Tailwind CSS, TanStack Query, and Zustand.
- `server/`: REST API layer structured with modular domain controllers, services, routes, and validation schemas.
- `server/prisma/`: Schema definitions and migration histories for the relational PostgreSQL database.
- `docs/`: Technical specifications, API reference, and deployment runbooks.
