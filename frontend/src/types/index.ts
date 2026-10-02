// ─── Enums (const objects + union types) ─────────────────────────────────────

export const Role = {
  STUDENT: 'STUDENT',
  TPO: 'TPO',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ApplicationStatus = {
  APPLIED: 'APPLIED',
  SHORTLISTED: 'SHORTLISTED',
  REJECTED: 'REJECTED',
  SELECTED: 'SELECTED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const DriveStatus = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
} as const;
export type DriveStatus = (typeof DriveStatus)[keyof typeof DriveStatus];

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// ─── Student Profile ──────────────────────────────────────────────────────────

export interface Subject10th {
  name: string;
  marks: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  email: string;

  // Personal
  fullName: string;
  phone: string;
  dateOfBirth: string;

  // 10th grade
  subjects10th: Subject10th[];
  percentage10th: number;

  // Education type
  isD2D: boolean;

  // D2D path (diploma → degree)
  d2dCgpa?: number;

  // Non-D2D path (12th → degree)
  percentage12th?: number;

  // Academic
  cpi: number;

  // Locked once submitted
  profileLocked: boolean;
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Recruitment Drive ────────────────────────────────────────────────────────

export interface RecruitmentDrive {
  id: string;
  title: string;
  companyId: string;
  company?: Company;
  description: string;
  role: string;
  ctc: string;
  location: string;
  driveDate: string;
  applicationDeadline: string;
  status: DriveStatus;
  // Eligibility criteria
  minPercentage10th?: number;
  minPercentage12th?: number;
  minD2dCgpa?: number;
  minCpi?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  studentId: string;
  student?: StudentProfile;
  driveId: string;
  drive?: RecruitmentDrive;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
