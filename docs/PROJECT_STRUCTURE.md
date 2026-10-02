# Project Structure

- **frontend responsibility**: Handling the user interface, state management, and interaction with the APIs. To be built with Next.js, and styled with Tailwind CSS.
- **backend responsibility**: Processing business logic, managing security and roles, keeping the system scalable. To be built with Express and Node.js.
- **database responsibility**: Safely storing the relation data of users, companies, recruitment drives, and applications using PostgreSQL. Database interactions handled via Prisma ORM.
- **communication flow**: REST API from frontend fetch methods to backend endpoints, returning JSON representations of resources.
- **future student module**: Functionalities centered around letting a student build a profile, view relevant drives, and apply.
- **future TPO module**: TPO will act as administrator and HR: verifying users, posting drives, and shortlisting applications.
