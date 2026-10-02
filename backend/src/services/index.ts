export { registerUser, loginUser, getUserById } from './auth.service';
export type { SafeUser, RegisterInput, LoginInput } from './auth.service';

export { getProfile, createProfile, updateProfile } from './student.service';
export type { CreateProfileInput, UpdateProfileInput, TenthSubjectMarks } from './student.service';

export { getAllCompanies, createCompany } from './company.service';
export type { CreateCompanyInput, CompanyRecord } from './company.service';
