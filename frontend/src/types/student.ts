// ─── Shared API response envelope ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}

// ─── Student profile ───────────────────────────────────────────────────────────

export interface TenthSubjectMarks {
    tenthMaths: number;
    tenthPhysics: number;
    tenthChemistry: number;
    tenthEnglish: number;
    tenthComputer: number;
}

export interface StudentProfile {
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    dob: string;
    tenthSubjectMarks: TenthSubjectMarks | null;
    tenthPercentage: number;
    twelfthPercentage: number | null;
    isD2D: boolean;
    d2dCgpa: number | null;
    cpi: number;
    profileLocked: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProfilePayload {
    fullName: string;
    phone: string;
    dob: string;
    tenthSubjectMarks: TenthSubjectMarks;
    tenthPercentage: number;
    isD2D: boolean;
    twelfthPercentage?: number;
    d2dCgpa?: number;
    cpi: number;
}

// ─── Recruitment drives ────────────────────────────────────────────────────────

export interface Company {
    id: string;
    name: string;
    imageUrl: string | null;
}

export interface RecruitmentDrive {
    id: string;
    role: string;
    ctc: number;
    description: string;
    deadline: string;
    minTenthPercentage: number | null;
    minTwelfthPercentage: number | null;
    minD2DCgpa: number | null;
    minCpi: number | null;
    createdAt: string;
    updatedAt: string;
    company: Company;
}
