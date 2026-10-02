'use client';

import { useEffect, useState, useCallback } from 'react';
import DriveCard from '@/components/DriveCard';
import { fetchDrives, applyToDrive } from '@/lib/api';
import type { RecruitmentDrive } from '@/types/student';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DriveSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-4 w-40 rounded bg-slate-200" />
                </div>
                <div className="space-y-2">
                    <div className="h-5 w-20 rounded bg-slate-200" />
                    <div className="h-3 w-16 rounded bg-slate-200" />
                </div>
            </div>
            <div className="space-y-3 px-5 py-4">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-5/6 rounded bg-slate-100" />
                <div className="h-3 w-4/6 rounded bg-slate-100" />
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
                <div className="h-10 w-full rounded-xl bg-slate-200" />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DrivesPage() {
    const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const loadDrives = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchDrives();
            if (res.success && res.data?.drives) {
                setDrives(res.data.drives);
            } else {
                setError(res.message || 'Failed to load drives.');
            }
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDrives(); }, [loadDrives]);

    // Auto-dismiss toast after 4 s
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    async function handleApply(driveId: string) {
        if (applyingId) return;
        setApplyingId(driveId);
        try {
            const res = await applyToDrive(driveId);
            if (res.success) {
                setToast({ msg: 'Application submitted successfully!', type: 'success' });
            } else {
                setToast({ msg: res.message || 'Could not apply. Please try again.', type: 'error' });
            }
        } catch {
            setToast({ msg: 'Network error. Please try again.', type: 'error' });
        } finally {
            setApplyingId(null);
        }
    }

    const activeCount = drives.filter((d) => new Date(d.deadline) >= new Date()).length;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <header className="border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Recruitment Drives
                            </h1>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Mini Placement Portal
                            </p>
                        </div>
                        <a
                            href="/student/profile"
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
                        >
                            ← My Profile
                        </a>
                    </div>
                </div>
            </header>

            {/* ── Main ─────────────────────────────────────────────────────── */}
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

                {/* Stats bar */}
                {!loading && !error && drives.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200">
                            {drives.length} total drive{drives.length !== 1 ? 's' : ''}
                        </span>
                        {activeCount > 0 && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                                {activeCount} active
                            </span>
                        )}
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                        <p className="text-3xl">⚠️</p>
                        <p className="font-semibold text-red-700">{error}</p>
                        <button
                            onClick={loadDrives}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <DriveSkeleton key={i} />)}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && drives.length === 0 && (
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
                        <p className="text-5xl">🏢</p>
                        <h2 className="text-lg font-semibold text-slate-700">
                            No drives yet
                        </h2>
                        <p className="max-w-xs text-sm text-slate-400">
                            Recruitment drives will appear here once the TPO publishes them. Check back soon!
                        </p>
                    </div>
                )}

                {/* Drive grid */}
                {!loading && !error && drives.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {drives.map((drive) => (
                            <DriveCard
                                key={drive.id}
                                drive={drive}
                                onApply={handleApply}
                                applying={applyingId === drive.id}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* ── Toast notification ────────────────────────────────────────── */}
            {toast && (
                <div
                    className={[
                        'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all',
                        toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600',
                    ].join(' ')}
                >
                    {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                </div>
            )}
        </div>
    );
}
