// ─── Input types ──────────────────────────────────────────────────────────────

/**
 * Minimal subset of StudentProfile required by the eligibility check.
 * Using a plain interface (not the Prisma type) keeps this service
 * decoupled from the ORM — it can be tested without a database.
 */
export interface EligibilityProfile {
    profileLocked: boolean;
    isVerified: boolean;
    tenthPercentage: number;
    twelfthPercentage: number | null;
    isD2D: boolean;
    d2dCgpa: number | null;
    cpi: number;
}

/**
 * Minimal subset of RecruitmentDrive required for eligibility.
 */
export interface EligibilityDrive {
    minTenthPercentage: number | null;
    minTwelfthPercentage: number | null;
    minD2DCgpa: number | null;
    minCpi: number | null;
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface EligibilityResult {
    eligible: boolean;
    /** Human-readable reasons for ineligibility. Empty when eligible. */
    reasons: string[];
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Pure eligibility check — no side effects, no database calls.
 *
 * Rules (in order):
 *  1. Profile must be locked (completed).
 *  2. Profile must be verified by TPO.
 *  3. 10th percentage must meet the drive minimum.
 *  4. Non-D2D: 12th percentage must exist and meet the minimum when required.
 *  5. D2D:     D2D CGPA must exist and meet the minimum when required.
 *  6. CPI must meet the drive minimum.
 *
 * @param profile - The student's academic profile.
 * @param drive   - The drive's eligibility criteria.
 * @returns { eligible, reasons }
 */
export function checkStudentEligibility(
    profile: EligibilityProfile,
    drive: EligibilityDrive,
): EligibilityResult {
    const reasons: string[] = [];

    // ── Rule 1: Profile must be locked (completed) ─────────────────────────
    if (!profile.profileLocked) {
        reasons.push('Profile is not yet completed and locked.');
    }

    // ── Rule 2: Profile must be verified ───────────────────────────────────
    if (!profile.isVerified) {
        reasons.push('Profile has not been verified by the TPO.');
    }

    // ── Rule 3: 10th percentage ────────────────────────────────────────────
    if (
        drive.minTenthPercentage !== null &&
        profile.tenthPercentage < drive.minTenthPercentage
    ) {
        reasons.push(
            `10th percentage ${profile.tenthPercentage}% does not meet the minimum of ${drive.minTenthPercentage}%.`,
        );
    }

    // ── Rule 4 / 5: D2D vs non-D2D ────────────────────────────────────────
    if (profile.isD2D) {
        // Rule 5a: CGPA must exist when a minimum is set
        if (drive.minD2DCgpa !== null) {
            if (profile.d2dCgpa === null) {
                reasons.push(
                    `D2D CGPA is required but not recorded on the profile.`,
                );
            } else if (profile.d2dCgpa < drive.minD2DCgpa) {
                reasons.push(
                    `D2D CGPA ${profile.d2dCgpa} does not meet the minimum of ${drive.minD2DCgpa}.`,
                );
            }
        }
    } else {
        // Rule 4a: 12th percentage must exist when a minimum is set
        if (drive.minTwelfthPercentage !== null) {
            if (profile.twelfthPercentage === null) {
                reasons.push(
                    `12th percentage is required but not recorded on the profile.`,
                );
            } else if (profile.twelfthPercentage < drive.minTwelfthPercentage) {
                reasons.push(
                    `12th percentage ${profile.twelfthPercentage}% does not meet the minimum of ${drive.minTwelfthPercentage}%.`,
                );
            }
        }
    }

    // ── Rule 6: CPI ────────────────────────────────────────────────────────
    if (drive.minCpi !== null && profile.cpi < drive.minCpi) {
        reasons.push(
            `CPI ${profile.cpi} does not meet the minimum of ${drive.minCpi}.`,
        );
    }

    return { eligible: reasons.length === 0, reasons };
}
