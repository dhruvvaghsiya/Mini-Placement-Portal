export { registerUser, loginUser, getUserById } from './auth.service';
export type { SafeUser, RegisterInput, LoginInput } from './auth.service';

export { getProfile, createProfile, updateProfile } from './student.service';
export type { CreateProfileInput, UpdateProfileInput, TenthSubjectMarks } from './student.service';

export { getAllCompanies, createCompany } from './company.service';
export type { CreateCompanyInput, CompanyRecord } from './company.service';

export { getAllDrives, getDriveById, getEligibleStudentsForDrive, createDrive, applyToDrive } from './drive.service';
export type { DriveWithCompany, EligibleStudent, CreateDriveInput } from './drive.service';

export { checkStudentEligibility } from './eligibility.service';
export type { EligibilityProfile, EligibilityDrive, EligibilityResult } from './eligibility.service';

export { verifyStudent, getAllApplications, updateApplicationStatus, ALLOWED_STATUSES, getDashboardStats, getAllStudents, getStudentById } from './tpo.service';
export type { VerificationResult, ApplicationListItem, DashboardStats } from './tpo.service';


