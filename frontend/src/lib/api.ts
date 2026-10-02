import { API_BASE_URL } from './constants';
import type {
  User,
  StudentProfile,
  Company,
  RecruitmentDrive,
  Application,
  ApplicationStatus,
  DriveStatus,
  TpoDashboardStats,
} from '../types';
import type { ApiResponse, RecruitmentDrive as StudentRecruitmentDrive } from '../types/student';

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

  const raw = (body as { data?: any }).data ?? body;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if ('drives' in raw && Array.isArray(raw.drives)) return raw.drives as unknown as T;
    if ('companies' in raw && Array.isArray(raw.companies)) return raw.companies as unknown as T;
    if ('applications' in raw && Array.isArray(raw.applications)) return raw.applications as unknown as T;
    if ('students' in raw && Array.isArray(raw.students)) return raw.students as unknown as T;
    if ('profile' in raw && raw.profile && typeof raw.profile === 'object') return raw.profile as unknown as T;
    if ('drive' in raw && raw.drive && typeof raw.drive === 'object') return raw.drive as unknown as T;
    if ('company' in raw && raw.company && typeof raw.company === 'object') return raw.company as unknown as T;
    if ('application' in raw && raw.application && typeof raw.application === 'object') return raw.application as unknown as T;
    if ('student' in raw && raw.student && typeof raw.student === 'object') return raw.student as unknown as T;
    if ('stats' in raw && raw.stats && typeof raw.stats === 'object') return raw.stats as unknown as T;
    if ('user' in raw && raw.user && typeof raw.user === 'object') return raw.user as unknown as T;
  }
  return raw as T;
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
      body: JSON.stringify({
        ...payload,
        dob: payload.dateOfBirth,
      }),
    }),

  /** TPO: list all student profiles */
  listAll: () =>
    request<StudentProfile[]>('/tpo/students'),

  /** TPO: get a specific student by id */
  getById: (id: string) =>
    request<StudentProfile>(`/tpo/students/${id}`),

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
      body: JSON.stringify({
        ...payload,
        imageUrl: payload.logoUrl ?? (payload as any).imageUrl,
      }),
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

  create: (payload: DrivePayload) => {
    const ctcNum = typeof payload.ctc === 'string' ? parseFloat(payload.ctc) : payload.ctc;
    return request<RecruitmentDrive>('/drives', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        ctc: isNaN(ctcNum) ? payload.ctc : ctcNum,
        deadline: payload.applicationDeadline ?? (payload as any).deadline,
        minTenthPercentage: payload.minPercentage10th,
        minTwelfthPercentage: payload.minPercentage12th,
        minD2DCgpa: payload.minD2dCgpa,
      }),
    });
  },

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

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  getTpoStats: () =>
    request<TpoDashboardStats>('/tpo/dashboard/stats'),
};

// ─── Compatibility helpers (named exports used by some pages) ─────────────────

/**
 * Fetch all open recruitment drives.
 * Returns an ApiResponse envelope so pages can check res.success / res.data.drives.
 */
export async function fetchDrives(): Promise<ApiResponse<{ drives: StudentRecruitmentDrive[] }>> {
  try {
    const drives = await driveApi.list() as unknown as StudentRecruitmentDrive[];
    return { success: true, message: 'OK', data: { drives } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load drives.';
    return { success: false, message };
  }
}

/**
 * Apply to a recruitment drive.
 * Returns an ApiResponse envelope so pages can check res.success.
 */
export async function applyToDrive(driveId: string): Promise<ApiResponse<unknown>> {
  try {
    await applicationApi.apply(driveId);
    return { success: true, message: 'Applied successfully.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to apply.';
    return { success: false, message };
  }
}
