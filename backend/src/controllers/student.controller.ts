import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/student.service';
import type { CreateProfileInput, TenthSubjectMarks } from '../services/student.service';

// ─── Validation helpers ───────────────────────────────────────────────────────

function isPositiveNumber(v: unknown): v is number {
    return typeof v === 'number' && isFinite(v) && v >= 0;
}

function isValidDateString(v: unknown): v is string {
    if (typeof v !== 'string' || !v.trim()) return false;
    const d = new Date(v);
    return !isNaN(d.getTime());
}

/**
 * Validates and normalises the request body for profile creation.
 * Returns { errors, data } — data is only set when errors is empty.
 */
function validateCreateBody(body: Record<string, unknown>): {
    errors: string[];
    data?: CreateProfileInput;
} {
    const errors: string[] = [];

    // ── Personal ─────────────────────────────────────────────────────────────
    if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
        errors.push('fullName is required');
    }
    if (!body.phone || typeof body.phone !== 'string' || !/^\d{10}$/.test(body.phone.trim())) {
        errors.push('phone must be a 10-digit number');
    }
    const rawDob = (body.dob ?? body.dateOfBirth) as unknown;
    if (!isValidDateString(rawDob)) {
        errors.push('dob must be a valid ISO date string (e.g. "2003-05-15")');
    }

    // ── 10th subject marks ───────────────────────────────────────────────────
    let sm = body.tenthSubjectMarks as Record<string, unknown> | undefined;
    if ((!sm || typeof sm !== 'object') && Array.isArray(body.subjects10th)) {
        sm = {
            tenthMaths: 0,
            tenthPhysics: 0,
            tenthChemistry: 0,
            tenthEnglish: 0,
            tenthComputer: 0,
        };
        for (const s of body.subjects10th as { name: string; marks: number }[]) {
            const n = (s.name || '').toLowerCase();
            const m = Number(s.marks) || 0;
            if (n.includes('math')) sm.tenthMaths = m;
            else if (n.includes('phys')) sm.tenthPhysics = m;
            else if (n.includes('chem')) sm.tenthChemistry = m;
            else if (n.includes('eng')) sm.tenthEnglish = m;
            else if (n.includes('comp')) sm.tenthComputer = m;
        }
    }

    const subjectKeys: (keyof TenthSubjectMarks)[] = [
        'tenthMaths', 'tenthPhysics', 'tenthChemistry', 'tenthEnglish', 'tenthComputer',
    ];
    if (!sm || typeof sm !== 'object') {
        errors.push('tenthSubjectMarks object is required');
    } else {
        for (const key of subjectKeys) {
            if (!isPositiveNumber(sm[key])) {
                errors.push(`tenthSubjectMarks.${key} must be a non-negative number`);
            }
        }
    }

    // ── tenthPercentage ──────────────────────────────────────────────────────
    if (!isPositiveNumber(body.tenthPercentage) || (body.tenthPercentage as number) > 100) {
        errors.push('tenthPercentage must be a number between 0 and 100');
    }

    // ── isD2D ────────────────────────────────────────────────────────────────
    if (typeof body.isD2D !== 'boolean') {
        errors.push('isD2D must be a boolean');
    }

    // ── Conditional: twelfthPercentage / d2dCgpa ─────────────────────────────
    if (body.isD2D === false) {
        if (
            body.twelfthPercentage === undefined ||
            !isPositiveNumber(body.twelfthPercentage) ||
            (body.twelfthPercentage as number) > 100
        ) {
            errors.push('twelfthPercentage is required for non-D2D students and must be 0–100');
        }
    }
    if (body.isD2D === true) {
        if (
            body.d2dCgpa === undefined ||
            !isPositiveNumber(body.d2dCgpa) ||
            (body.d2dCgpa as number) > 10
        ) {
            errors.push('d2dCgpa is required for D2D students and must be 0–10');
        }
    }

    // ── cpi ──────────────────────────────────────────────────────────────────
    if (
        body.cpi === undefined ||
        !isPositiveNumber(body.cpi) ||
        (body.cpi as number) > 10
    ) {
        errors.push('cpi must be a number between 0 and 10');
    }

    if (errors.length > 0) return { errors };

    // All valid — build typed input
    const data: CreateProfileInput = {
        fullName: (body.fullName as string).trim(),
        phone: (body.phone as string).trim(),
        dob: rawDob as string,
        tenthSubjectMarks: sm as unknown as TenthSubjectMarks,
        tenthPercentage: body.tenthPercentage as number,
        isD2D: body.isD2D as boolean,
        twelfthPercentage: body.twelfthPercentage as number | undefined,
        d2dCgpa: body.d2dCgpa as number | undefined,
        cpi: body.cpi as number,
    };

    return { errors: [], data };
}

function formatProfileResponse(profile: any) {
    if (!profile) return profile;
    const sm = (profile.tenthSubjectMarks as Record<string, number>) || {};
    return {
        ...profile,
        dateOfBirth: profile.dob instanceof Date ? profile.dob.toISOString().split('T')[0] : (profile.dob ?? profile.dateOfBirth),
        subjects10th: Array.isArray(profile.subjects10th) ? profile.subjects10th : [
            { name: 'Mathematics', marks: sm.tenthMaths ?? 0 },
            { name: 'Physics', marks: sm.tenthPhysics ?? 0 },
            { name: 'Chemistry', marks: sm.tenthChemistry ?? 0 },
            { name: 'English', marks: sm.tenthEnglish ?? 0 },
            { name: 'Computer Science', marks: sm.tenthComputer ?? 0 },
        ],
    };
}

// ─── GET /api/students/profile ────────────────────────────────────────────────

/**
 * Returns the authenticated student's profile.
 * 404 if the student has not yet submitted a profile.
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const rawProfile = await studentService.getProfile(req.user!.id);

        if (!rawProfile) {
            res.status(404).json({
                success: false,
                message: 'Profile not found. Please submit your profile first.',
            });
            return;
        }

        const profile = formatProfileResponse(rawProfile);

        res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: { profile },
            profile,
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/students/profile ───────────────────────────────────────────────

/**
 * Creates the student's profile for the first time.
 * Locks the profile immediately on successful creation.
 */
export async function createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const body = req.body as Record<string, unknown>;
        const { errors, data } = validateCreateBody(body);

        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
            return;
        }

        const rawProfile = await studentService.createProfile(req.user!.id, data!);
        const profile = formatProfileResponse(rawProfile);

        res.status(201).json({
            success: true,
            message: 'Profile created and locked successfully',
            data: { profile },
            profile,
        });
    } catch (err) {
        if (err instanceof Error && err.message.includes('already exists')) {
            res.status(409).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
}

// ─── PATCH /api/students/profile ─────────────────────────────────────────────

/**
 * Updates an existing, unlocked profile.
 * All fields are optional — only provided fields are updated.
 * Rejects with 403 if the profile is locked.
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const body = req.body as Record<string, unknown>;

        // At least one field must be provided
        if (!body || Object.keys(body).length === 0) {
            res.status(400).json({ success: false, message: 'Request body cannot be empty' });
            return;
        }

        // Per-field validation (only for fields that are present)
        const errors: string[] = [];

        if (body.fullName !== undefined && (typeof body.fullName !== 'string' || !body.fullName.trim())) {
            errors.push('fullName must be a non-empty string');
        }
        if (body.phone !== undefined && (typeof body.phone !== 'string' || !/^\d{10}$/.test(body.phone.trim()))) {
            errors.push('phone must be a 10-digit number');
        }
        if (body.dob !== undefined && !isValidDateString(body.dob)) {
            errors.push('dob must be a valid ISO date string');
        }
        if (body.tenthPercentage !== undefined && (!isPositiveNumber(body.tenthPercentage) || (body.tenthPercentage as number) > 100)) {
            errors.push('tenthPercentage must be 0–100');
        }
        if (body.twelfthPercentage !== undefined && (!isPositiveNumber(body.twelfthPercentage) || (body.twelfthPercentage as number) > 100)) {
            errors.push('twelfthPercentage must be 0–100');
        }
        if (body.d2dCgpa !== undefined && (!isPositiveNumber(body.d2dCgpa) || (body.d2dCgpa as number) > 10)) {
            errors.push('d2dCgpa must be 0–10');
        }
        if (body.cpi !== undefined && (!isPositiveNumber(body.cpi) || (body.cpi as number) > 10)) {
            errors.push('cpi must be 0–10');
        }

        if (errors.length > 0) {
            res.status(400).json({ success: false, message: 'Validation failed', errors });
            return;
        }

        const rawProfile = await studentService.updateProfile(req.user!.id, body);
        const profile = formatProfileResponse(rawProfile);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { profile },
            profile,
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.includes('locked')) {
                res.status(403).json({ success: false, message: err.message });
                return;
            }
            if (err.message.includes('not found')) {
                res.status(404).json({ success: false, message: err.message });
                return;
            }
        }
        next(err);
    }
}
