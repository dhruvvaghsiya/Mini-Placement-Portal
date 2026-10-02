import { API_BASE_URL } from './constants';
import type {
  User,
  StudentProfile,
  Company,
  RecruitmentDrive,
  Application,
  ApplicationStatus,
  DriveStatus,
} from '../types';

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include', // send / receive HTTP-only cookies
    ...options,
  });

  // Parse JSON even on error responses (backend may include { message, errors })
  let body: { message?: string; errors?: Record<string, string[]>; data?: T } = {};
  try {
    body = await res.json();
  } catch {
    // empty body – ignore
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.message ?? `Request failed (${res.status})`,
      body.errors,
    );
  }

  return (body as { data: T }).data ?? (body as unknown as T);
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: () => request<User>('/auth/me'),
};

// ─── Student Profile API ───────────────────────────────────────────────────────

export interface StudentProfilePayload {
  // Personal
  fullName: string;
  phone: string;
  dateOfBirth: string;

  // 10th grade
  subjects10th: { name: string; marks: number }[];
  percentage10th: number;

  // Education type
  isD2D: boolean;

  // D2D path (diploma → degree)
  d2dCgpa?: number;

  // Non-D2D path (12th → degree)
  percentage12th?: number;

  // Academic
  cpi: number;
}

export const studentApi = {
  getProfile: () =>
    request<StudentProfile>('/students/profile'),

  saveProfile: (payload: StudentProfilePayload) =>
    request<StudentProfile>('/students/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** TPO: list all student profiles */
  listAll: () =>
    request<StudentProfile[]>('/students'),

  /** TPO: get a specific student by id */
  getById: (id: string) =>
    request<StudentProfile>(`/students/${id}`),

  /** TPO: verify a student */
  verify: (id: string) =>
    request<StudentProfile>(`/tpo/students/${id}/verify`, {
      method: 'PATCH',
    }),
};

// ─── Company API ──────────────────────────────────────────────────────────────

export interface CompanyPayload {
  name: string;
  website?: string;
  industry: string;
  description?: string;
  logoUrl?: string;
}

export const companyApi = {
  list: () =>
    request<Company[]>('/companies'),

  get: (id: string) =>
    request<Company>(`/companies/${id}`),

  create: (payload: CompanyPayload) =>
    request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<CompanyPayload>) =>
    request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request<void>(`/companies/${id}`, { method: 'DELETE' }),
};

// ─── Recruitment Drive API ────────────────────────────────────────────────────

export interface DrivePayload {
  title: string;
  companyId: string;
  description: string;
  role: string;
  ctc: string;
  location: string;
  driveDate: string;
  applicationDeadline: string;
  minPercentage10th?: number;
  minPercentage12th?: number;
  minD2dCgpa?: number;
  minCpi?: number;
}

export const driveApi = {
  list: () =>
    request<RecruitmentDrive[]>('/drives'),

  get: (id: string) =>
    request<RecruitmentDrive>(`/drives/${id}`),

  create: (payload: DrivePayload) =>
    request<RecruitmentDrive>('/drives', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<DrivePayload>) =>
    request<RecruitmentDrive>(`/drives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  /** TPO: change the status of a drive */
  updateStatus: (id: string, status: DriveStatus) =>
    request<RecruitmentDrive>(`/drives/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ─── Application API ──────────────────────────────────────────────────────────

export const applicationApi = {
  /** Student: apply to a drive */
  apply: (driveId: string) =>
    request<Application>(`/drives/${driveId}/apply`, {
      method: 'POST',
    }),

  /** Student: list own applications */
  myApplications: () =>
    request<Application[]>('/applications/mine'),

  /** TPO: list all applications */
  listAllTpo: () =>
    request<Application[]>('/tpo/applications'),

  /** TPO: update the status of an application */
  updateStatus: (id: string, status: ApplicationStatus) =>
    request<Application>(`/tpo/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
