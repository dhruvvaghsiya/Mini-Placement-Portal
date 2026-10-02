# Database Design

## Entities

- **User**: Base model for authentication capturing Role (STUDENT vs TPO), email, and hashed passwords.
- **StudentProfile**: Associated with a User. Stores personal details, 10th and 12th marks/percentage, CPI, CGPA for D2D students. Has a locked verification status boolean.
- **Company**: Stores company information (name, description, website).
- **RecruitmentDrive**: Posted by a TPO. Outlines role, compensation, and eligibility rules (like min CPI, etc.) and relationship to Company.
- **Application**: Join table mapping a Student to a RecruitmentDrive with status states (pending, rejected, accepted, hired).

## Relationships
- User 1:1 StudentProfile
- Company 1:N RecruitmentDrive
- RecruitmentDrive 1:N Application
- StudentProfile 1:N Application
