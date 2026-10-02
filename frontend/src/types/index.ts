// ─── User & Auth ────────────────────────────────────────────────────────────

export type Role = 'student' | 'tpo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

// ─── Student ─────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  branch: string;
  batch: number;
  cgpa: number;
  resumeUrl?: string;
  skills: string[];
  isPlaced: boolean;
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry: string;
  description?: string;
}

// ─── Drive ───────────────────────────────────────────────────────────────────

export type DriveStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Drive {
  id: string;
  title: string;
  companyId: string;
  company?: Company;
  description: string;
  eligibilityCriteria: string;
  package: string;
  location: string;
  driveDate: string;
  applicationDeadline: string;
  status: DriveStatus;
}

// ─── Application ─────────────────────────────────────────────────────────────

export type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected' | 'placed';

export interface Application {
  id: string;
  studentId: string;
  student?: Student;
  driveId: string;
  drive?: Drive;
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
