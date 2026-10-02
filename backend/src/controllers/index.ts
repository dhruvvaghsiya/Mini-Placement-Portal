export { register, login, me, logout } from './auth.controller';
export { getProfile, createProfile, updateProfile } from './student.controller';
export { getCompanies, createCompany } from './company.controller';
export { getDrives, getDriveById, getEligibleStudents, createDrive, applyToDrive } from './drive.controller';
export { verifyStudentHandler, getApplicationsHandler, updateApplicationStatusHandler, getDashboardStatsHandler } from './tpo.controller';

