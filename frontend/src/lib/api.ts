import type {
    ApiResponse,
    CreateProfilePayload,
    StudentProfile,
    RecruitmentDrive,
} from '@/types/student';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send/receive HttpOnly cookies
        ...options,
    });
    const json = (await res.json()) as ApiResponse<T>;
    return json;
}

// ─── Student profile ──────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<ApiResponse<{ profile: StudentProfile }>> {
    return apiFetch<{ profile: StudentProfile }>('/api/students/profile');
}

export async function createProfile(
    payload: CreateProfilePayload,
): Promise<ApiResponse<{ profile: StudentProfile }>> {
    return apiFetch<{ profile: StudentProfile }>('/api/students/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateProfile(
    payload: Partial<CreateProfilePayload>,
): Promise<ApiResponse<{ profile: StudentProfile }>> {
    return apiFetch<{ profile: StudentProfile }>('/api/students/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

// ─── Recruitment drives ───────────────────────────────────────────────────────

export async function fetchDrives(): Promise<ApiResponse<{ drives: RecruitmentDrive[] }>> {
    return apiFetch<{ drives: RecruitmentDrive[] }>('/api/drives');
}

export async function applyToDrive(driveId: string): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/api/drives/${driveId}/apply`, { method: 'POST' });
}
