# Mini Placement Portal

## Project Overview
Mini Placement Portal with two roles: Student and TPO / Central TPO. 

Project Status:
Development in progress

## Objective
To simplify and provide a central platform for college placements, allowing students to register and apply while TPOs can verify, create recruitment drives and monitor applications.

## Technology Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma

## Student Features
- Student registration
- Personal details
- 10th subject marks, 10th percentage
- 12th percentage for non-D2D students / D2D CGPA for D2D students
- CPI
- Profile locking after submission
- View companies & recruitment drives
- Apply only when eligible
- View application status

## Central TPO Features
- View student profiles, Verify students
- Add companies & recruitment drives
- Define eligibility criteria
- Filter eligible students
- Monitor applications, Update application status

## Project Structure
```
Mini-Placement-Portal/
├── frontend/
├── backend/
├── docs/
├── README.md
├── .gitignore
└── package.json
```

## Team Development Workflow
1. Use feature branches off `main` for individual team work.
2. `main` branch acts as the stable integration branch.
3. Code collaboratively on features respecting team ownership definitions.

## Local Setup
1. Clone the repository
2. Install frontend and backend dependencies
3. Setup PostgreSQL database and Prisma schema
4. Create environment variables for frontend and backend
5. Start development servers

## Database Seed & Testing
Run commands from the `backend/` directory:

- **Database Seed**: `npm run db:seed` (or `npx prisma db seed`)
- **Integration Tests**: `npm test`
- **Schema Validation**: `npx prisma validate`
- **Type Checking**: `npx tsc --noEmit`

### Demo Credentials
| Role | Email | Password | Description |
| --- | --- | --- | --- |
| Central TPO | `tpo@admin.com` | `Password123!` | Full TPO administrative access |
| Eligible Student | `student.eligible@example.com` | `Password123!` | Locked & verified student (12th path, CPI 8.75) |
| D2D Student | `student.d2d@example.com` | `Password123!` | Locked & verified student (Diploma path, CGPA 8.9, CPI 8.4) |
| Low CPI Student | `student.lowcpi@example.com` | `Password123!` | Locked & verified student (CPI 5.5) |
| Unverified Student | `student.unverified@example.com` | `Password123!` | Profile locked, pending TPO verification |
| New Student | `student.new@example.com` | `Password123!` | Fresh account, no profile created yet |

## Environment Variables
Environment variables should not be committed to the repository. Please use the `.env.example` file provided in both frontend and backend to structure your own `.env` fields. Example configuration values include:
- Frontend: `NEXT_PUBLIC_API_URL`
- Backend: `PORT`, `DATABASE_URL`, `JWT_SECRET`

## Future Deployment
Deployment configurations, pipelines, and server provisioning will be defined in a later phase.
