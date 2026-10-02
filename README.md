# Mini Placement Portal

A full-stack, enterprise-grade placement management platform designed for universities and colleges. The portal coordinates recruitment drives, student academic records, eligibility filtering, and application status tracking between Students and Training & Placement Officers (TPO).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
  - [Student Capabilities](#student-capabilities)
  - [Central TPO Capabilities](#central-tpo-capabilities)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. PostgreSQL Database Setup](#2-postgresql-database-setup)
  - [3. Backend Setup & Prisma Configuration](#3-backend-setup--prisma-configuration)
  - [4. Frontend Setup](#4-frontend-setup)
- [Environment Variables](#environment-variables)
- [Seed Data & Demo Accounts](#seed-data--demo-accounts)
- [API Overview](#api-overview)
- [Verification & Quality Assurance](#verification--quality-assurance)
- [Deployment Information](#deployment-information)

---

## Project Overview

The **Mini Placement Portal** streamlines college campus recruitment by automating eligibility checking and providing transparency throughout the placement process:
- **For Students:** Registration, comprehensive profile submission (standard 12th path or Diploma-to-Degree D2D path), automatic profile locking, browsing published recruitment drives, real-time eligibility evaluation, single-click application, and status tracking.
- **For TPOs:** Student verification, company registration, recruitment drive management with customizable academic cutoffs (10th, 12th/D2D, CPI), automated applicant eligibility listing, application review, and status progression (`APPLIED` → `SHORTLISTED` → `SELECTED` / `REJECTED`).

---

## Key Features

### Student Capabilities
- **Authentication**: Secure account registration and cookie-based JWT authentication.
- **Academic Profile Management**:
  - Personal details (Full Name, Phone, Date of Birth).
  - 10th standard subject-wise marks breakdown and total percentage.
  - Academic pathway selection:
    - **Non-D2D (Regular)**: 12th standard percentage.
    - **D2D (Diploma to Degree)**: Diploma CGPA.
  - Current College CPI (Cumulative Performance Index).
- **Profile Locking**: Once submitted, student profiles are automatically locked to prevent unauthorized tampering prior to or after company drives.
- **Drive Exploration**: Real-time listing of active recruitment drives with compensation (CTC in LPA), role details, and deadlines.
- **Eligibility Verification**: Backend-enforced academic eligibility checks prevent students from applying to drives for which they do not meet minimum criteria.
- **Application Tracking**: View personal application history and monitor recruitment round progression.

### Central TPO Capabilities
- **Executive Dashboard**: Real-time aggregate statistics for total students, verified profiles, active drives, total applications, and round breakdowns.
- **Student Profile Verification**: Review submitted student academic records and officially verify student eligibility.
- **Company Management**: Onboard recruiting companies with branding and profile metadata.
- **Recruitment Drives**: Create and schedule drives with custom eligibility thresholds (`minTenthPercentage`, `minTwelfthPercentage`, `minD2DCgpa`, `minCpi`).
- **Eligible Candidate Pool**: Query and view all students meeting academic thresholds for any drive.
- **Application Monitoring & Management**: Review all student submissions across drives and advance candidates through recruitment stages (`APPLIED`, `SHORTLISTED`, `SELECTED`, `REJECTED`).

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) (App Router, Turbopack), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (Relational DB) |
| **ORM** | [Prisma ORM](https://www.prisma.io/) (Type-safe client, schema migrations, and seeding) |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), HTTP-Only Cookies (`cookie-parser`), [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing |
| **Code Quality** | ESLint 9, TypeScript Strict Mode, Turbopack |

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│     (Student Portal, Drive Catalog, Profile Forms)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON / Cookies
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Express.js REST API                   │
├────────────────────────────────────────────────────────┤
│  Middleware:                                           │
│  - CORS (origin & credentials check)                   │
│  - CookieParser & JWT Authentication                   │
│  - Role-Based Access Control (Student vs TPO)          │
├────────────────────────────────────────────────────────┤
│  Controllers & Service Layer:                          │
│  - Auth Service       - Student Service                │
│  - Company Service    - Drive & Eligibility Service    │
│  - TPO Service        - Application Service            │
├────────────────────────────────────────────────────────┤
│                     Prisma ORM                         │
└───────────────────────────┬────────────────────────────┘
                            │ PostgreSQL Protocol (Port 5432)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                   │
│  (Users, StudentProfiles, Companies, Drives, Apps)     │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Mini-Placement-Portal/
├── backend/
│   ├── prisma/
│   │   ├── migrations/             # Versioned SQL migrations
│   │   ├── schema.prisma           # Prisma data models & relations
│   │   └── seed.ts                 # Database seed script with demo data
│   ├── src/
│   │   ├── controllers/            # Express request handlers & validation
│   │   │   ├── auth.controller.ts
│   │   │   ├── company.controller.ts
│   │   │   ├── drive.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   └── tpo.controller.ts
│   │   ├── lib/                    # Shared database client singleton
│   │   │   └── prisma.ts
│   │   ├── middleware/             # Authentication & role guard middleware
│   │   │   └── authenticate.ts
│   │   ├── routes/                 # Express route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── company.routes.ts
│   │   │   ├── drive.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   └── tpo.routes.ts
│   │   ├── services/               # Business logic & database operations
│   │   │   ├── auth.service.ts
│   │   │   ├── company.service.ts
│   │   │   ├── drive.service.ts
│   │   │   ├── eligibility.service.ts
│   │   │   ├── student.service.ts
│   │   │   └── tpo.service.ts
│   │   ├── tests/                  # Integration test suite
│   │   │   └── integration.test.ts
│   │   ├── types/                  # Ambient TypeScript definitions
│   │   ├── utils/                  # Cryptography, JWT, and error helpers
│   │   └── app.ts                  # Express application entrypoint
│   ├── .env.example                # Backend environment variable template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Landing & authentication portal
│   │   │   └── student/
│   │   │       ├── drives/         # Recruitment drive browsing & apply
│   │   │       └── profile/        # Academic profile view & edit form
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/                    # Client-side API fetch client
│   │   └── types/                  # Shared frontend TypeScript interfaces
│   ├── .env.example                # Frontend environment variable template
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/                           # Architecture, API & Database specifications
│   ├── API.md
│   ├── DATABASE.md
│   ├── PROJECT_STRUCTURE.md
│   └── CODING_GUIDELINES.md
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.x or v20.x installed.
- **npm**: v9.x or later.
- **PostgreSQL**: Local PostgreSQL server running on port 5432 (or a hosted PostgreSQL instance like Supabase / Neon / AWS RDS).

---

### 1. Clone Repository
```bash
git clone https://github.com/dhruvvaghsiya/Mini-Placement-Portal.git
cd Mini-Placement-Portal
```

---

### 2. PostgreSQL Database Setup
Create a PostgreSQL database for the application:
```sql
CREATE DATABASE mini_placement_portal;
```

---

### 3. Backend Setup & Prisma Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL database credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mini_placement_portal
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   JWT_EXPIRES_IN=7d
   ```

4. Generate the Prisma Client and apply migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Seed the database with demo accounts and sample recruitment drives:
   ```bash
   npm run db:seed
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will start at `http://localhost:5000`.

---

### 4. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to your backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The application UI will be available at `http://localhost:3000`.

5. To create a production build:
   ```bash
   npm run build
   npm run start
   ```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Port for the Express server (default `5000`) | `5000` |
| `NODE_ENV` | Optional | Runtime environment (`development` / `production`) | `development` |
| `CLIENT_URL` | Yes | Frontend URL allowed by CORS | `http://localhost:3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/mini_placement_portal` |
| `JWT_SECRET` | Yes | Cryptographic secret for signing tokens | `min_32_chars_random_secret_key` |
| `JWT_EXPIRES_IN` | Optional | JWT lifespan duration | `7d` |

### Frontend (`frontend/.env.local`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for backend REST API calls | `http://localhost:5000/api` |

---

## Seed Data & Demo Accounts

The database seed script (`backend/prisma/seed.ts`) pre-populates realistic records covering various placement scenarios.

**Default password for all demo accounts:** `Password123!`

| Role | Email | Profile State | Academic Profile |
| :--- | :--- | :--- | :--- |
| **Central TPO** | `tpo@admin.com` | Verified Admin | Administrator (Full TPO Access) |
| **Eligible Student** | `student.eligible@example.com` | Locked & Verified | 12th Path (88%), CPI 8.75 — Meets high cutoff drives |
| **D2D Student** | `student.d2d@example.com` | Locked & Verified | Diploma Path (CGPA 8.90), CPI 8.40 |
| **Low CPI Student** | `student.lowcpi@example.com` | Locked & Verified | 12th Path (62%), CPI 5.50 — For testing rejection on cutoffs |
| **Unverified Student** | `student.unverified@example.com` | Locked, Pending TPO | 12th Path (76%), CPI 7.20 — Ready for TPO verification |
| **New Student** | `student.new@example.com` | Fresh Account | No profile yet — Ready to test profile submission |

---

## API Overview

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student or TPO account.
- `POST /api/auth/login` — Authenticate and receive HTTP-only JWT cookie.
- `POST /api/auth/logout` — Invalidate session and clear auth cookie.
- `GET /api/auth/me` — Return currently authenticated user session.

### 2. Student Profile & Applications (`/api/students`)
- `GET /api/students/profile` — Fetch the student's profile and academic record.
- `POST /api/students/profile` — Submit profile details (automatically locks upon submission).
- `PATCH /api/students/profile` — Modify profile (only allowed prior to locking).
- `GET /api/students/applications` — View all drives applied to by current student.

### 3. Companies (`/api/companies`)
- `GET /api/companies` — List all registered companies (Authenticated).
- `POST /api/companies` — Register a new hiring company (`TPO` only).

### 4. Recruitment Drives (`/api/drives`)
- `GET /api/drives` — List active recruitment drives with company info (Authenticated).
- `GET /api/drives/:id` — View specific drive specifications and eligibility requirements.
- `POST /api/drives` — Create a new recruitment drive with criteria (`TPO` only).
- `POST /api/drives/:id/apply` — Apply for a recruitment drive (`STUDENT` only, checks eligibility & uniqueness).
- `GET /api/drives/:id/eligible-students` — Query list of eligible students for a drive (`TPO` only).

### 5. Central TPO Management (`/api/tpo`)
- `GET /api/tpo/dashboard/stats` — Aggregate metrics and statistics (`TPO` only).
- `GET /api/tpo/students` — Retrieve all student profiles (`TPO` only).
- `GET /api/tpo/students/:id` — View full academic profile and history for a student (`TPO` only).
- `PATCH /api/tpo/students/:id/verify` — Officially verify a student's profile (`TPO` only).
- `GET /api/tpo/applications` — Monitor all applications across all drives (`TPO` only).
- `PATCH /api/tpo/applications/:id/status` — Advance or update application status (`TPO` only).

---

## Verification & Quality Assurance

Run the comprehensive validation test suite from the terminal:

### Backend Tests & Verification
```bash
cd backend

# Validate Prisma schema
npx prisma validate

# Run TypeScript type check
npx tsc --noEmit

# Run production build
npm run build

# Run end-to-end integration tests
npm test
```

### Frontend Tests & Verification
```bash
cd frontend

# Run ESLint validation
npm run lint

# Run TypeScript type check
npx tsc --noEmit

# Run Next.js production build
npm run build
```

---

## Deployment Information

The Mini Placement Portal is designed for cloud-native deployment:
- **Frontend**: Can be deployed to [Vercel](https://vercel.com/) or any Node.js hosting platform with zero configuration. Configure `NEXT_PUBLIC_API_URL` to point to the hosted backend.
- **Backend**: Can be containerized via Docker or hosted on [Render](https://render.com/), [Railway](https://railway.app/), or [AWS ECS / EC2].
- **Database**: Compatible with any managed PostgreSQL service including Supabase, Neon, AWS RDS, or Azure Database for PostgreSQL.
