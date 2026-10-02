import { API_BASE_URL } from './constants';

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
    // empty body
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

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'tpo';
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: () => request<AuthUser>('/auth/me'),
};

// ─── Student Profile API ───────────────────────────────────────────────────────

export interface Subject10th {
  name: string;
  marks: number;
}

export interface StudentProfilePayload {
  // Personal
  fullName: string;
  phone: string;
  dateOfBirth: string;

  // 10th
  subjects10th: Subject10th[];
  percentage10th: number;

  // Type
  isD2D: boolean;

  // D2D path
  d2dCgpa?: number;

  // Non-D2D path
  percentage12th?: number;

  // Academic
  cpi: number;
}

export interface StudentProfileResponse extends StudentProfilePayload {
  id: string;
  userId: string;
  email: string;              // read-only, from auth
  profileLocked: boolean;     // backend sets this — do NOT trust frontend
}

export const studentApi = {
  getProfile: () =>
    request<StudentProfileResponse>('/students/profile'),

  saveProfile: (payload: StudentProfilePayload) =>
    request<StudentProfileResponse>('/students/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
