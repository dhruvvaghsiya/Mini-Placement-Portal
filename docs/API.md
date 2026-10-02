# API Contracts

Authentication:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

Students:
GET /api/students/profile
POST /api/students/profile
PATCH /api/students/profile

Companies:
GET /api/companies
POST /api/companies

Recruitment Drives:
GET /api/drives
GET /api/drives/:id
POST /api/drives

Applications:
POST /api/drives/:id/apply
GET /api/students/applications

TPO:
GET /api/tpo/students
GET /api/tpo/students/:id
PATCH /api/tpo/students/:id/verify
GET /api/tpo/applications
PATCH /api/tpo/applications/:id/status
GET /api/tpo/dashboard/stats

Eligibility:
GET /api/drives/:id/eligible-students
