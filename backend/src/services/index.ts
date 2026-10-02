export { registerUser, loginUser, getUserById } from './auth.service';
export type { SafeUser, RegisterInput, LoginInput } from './auth.service';

export { getProfile, createProfile, updateProfile } from './student.service';
export type { CreateProfileInput, UpdateProfileInput, TenthSubjectMarks } from './student.service';

export { getAllCompanies, createCompany } from './company.service';
export type { CreateCompanyInput, CompanyRecord } from './company.service';

export { getAllDrives, getDriveById } from './drive.service';
export type { DriveWithCompany } from './drive.service';

