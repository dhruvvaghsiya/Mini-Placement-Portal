'use client';

import Image from 'next/image';
import type { RecruitmentDrive } from '@/types/student';

interface DriveCardProps {
    drive: RecruitmentDrive;
    onApply: (driveId: string) => void;
    applying: boolean;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function isExpired(deadline: string) {
    return new Date(deadline) < new Date();
}

function EligibilityBadge({ label, value }: { label: string; value: number | null }) {
    if (value === null) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {label}: <span className="font-semibold text-slate-800">{value}</span>
        </span>
    );
}

export default function DriveCard({ drive, onApply, applying }: DriveCardProps) {
    const expired = isExpired(drive.deadline);
    const hasEligibility =
        drive.minCpi !== null ||
        drive.minTenthPercentage !== null ||
        drive.minTwelfthPercentage !== null ||
        drive.minD2DCgpa !== null;

    return (
        <article className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-indigo-200">
            {/* Company header */}
            <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    {drive.company.imageUrl ? (
                        <Image
                            src={drive.company.imageUrl}
                            alt={`${drive.company.name} logo`}
                            fill
                            className="object-contain p-1"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                            {drive.company.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
                        {drive.company.name}
                    </p>
                    <h3 className="truncate text-base font-bold text-slate-900">{drive.role}</h3>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-emerald-600">₹{drive.ctc} LPA</p>
                    <p className={`text-xs font-medium ${expired ? 'text-red-500' : 'text-slate-400'}`}>
                        {expired ? '⛔ Expired' : `📅 ${formatDate(drive.deadline)}`}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                {/* Description */}
                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {drive.description}
                </p>

                {/* Eligibility */}
                {hasEligibility && (
                    <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Eligibility Criteria
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <EligibilityBadge label="Min CPI" value={drive.minCpi} />
                            <EligibilityBadge label="10th %" value={drive.minTenthPercentage} />
                            <EligibilityBadge label="12th %" value={drive.minTwelfthPercentage} />
                            <EligibilityBadge label="D2D CGPA" value={drive.minD2DCgpa} />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-4">
                {!expired ? (
                    <button
                        id={`apply-btn-${drive.id}`}
                        onClick={() => onApply(drive.id)}
                        disabled={applying}
                        className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {applying ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Applying…
                            </span>
                        ) : (
                            'Apply Now'
                        )}
                    </button>
                ) : (
                    <div className="w-full rounded-xl bg-slate-100 py-2.5 text-center text-sm font-medium text-slate-400">
                        Drive Closed
                    </div>
                )}
            </div>
        </article>
    );
}
