'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { studentApi, ApiError } from '@/lib/api';
import type { StudentProfile } from '@/types';
import { Role } from '@/types';
import { ROUTES } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

// ─── Status badges ────────────────────────────────────────────────────────────

function VerificationBadge({ isVerified }: { isVerified?: boolean }) {
    if (isVerified) {
        return <Badge label="Verified" variant="success" />;
    }
    return <Badge label="Unverified" variant="warning" />;
}

export default function TpoStudentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, isLoading: authLoading } = useAuth();

    const studentId = params.id as string;

    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // ── Auth guard ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace(ROUTES.LOGIN); return; }
        if (user.role !== Role.TPO) router.replace(ROUTES.STUDENT.DASHBOARD);
    }, [user, authLoading, router]);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading || !user || user.role !== Role.TPO) return;
        if (!studentId) return;

        let cancelled = false;
        (async () => {
            try {
                const data = await studentApi.getById(studentId);
                if (!cancelled) setStudent(data);
            } catch {
                if (!cancelled) setError('Failed to load student details. Please refresh.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [authLoading, user, studentId]);

    // ── Verify student ─────────────────────────────────────────────────────────
    const handleVerify = async () => {
        setVerifying(true);
        setVerifyError(null);
        try {
            await studentApi.verify(studentId);
            // Refresh from backend as requested
            const data = await studentApi.getById(studentId);
            setStudent(data);
        } catch (err) {
            setVerifyError(err instanceof ApiError ? err.message : 'Verification failed.');
        } finally {
            setVerifying(false);
        }
    };

    // ── Auth loading guard ─────────────────────────────────────────────────────
    if (authLoading || !user || user.role !== Role.TPO) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    // ── Loading state ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
                <div className="mx-auto max-w-4xl animate-pulse space-y-6">
                    <div className="h-8 w-1/4 rounded bg-gray-200" />
                    <div className="h-32 w-full rounded-xl bg-gray-200" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="h-48 w-full rounded-xl bg-gray-200" />
                        <div className="h-48 w-full rounded-xl bg-gray-200" />
                    </div>
                </div>
            </main>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────────────
    if (error || !student) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-12 text-center shadow-sm">
                    <p className="text-sm font-medium text-red-700">{error ?? 'Student not found.'}</p>
                    <Link href={ROUTES.TPO.STUDENTS} className="mt-4">
                        <Button variant="secondary">← Back to Students</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Navigation */}
                <div>
                    <Link href={ROUTES.TPO.STUDENTS} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Students
                    </Link>
                </div>

                {/* Master Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
                                <p className="text-gray-500">{student.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-3">
                                    <Badge label={student.profileLocked ? 'Locked Profile' : 'Draft Profile'} variant={student.profileLocked ? 'info' : 'default'} />
                                    <VerificationBadge isVerified={student.isVerified} />
                                </div>
                                {!student.isVerified && (
                                    <div className="mt-2 flex flex-col items-end gap-1">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleVerify}
                                            disabled={verifying}
                                        >
                                            {verifying ? 'Verifying...' : 'Verify Student'}
                                        </Button>
                                        {verifyError && (
                                            <p className="text-xs text-red-600 font-medium">{verifyError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">

                            {/* Personal Info */}
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Personal Information</h2>
                                <dl className="mt-4 space-y-4 text-sm text-gray-700">
                                    <div>
                                        <dt className="text-gray-400">Phone</dt>
                                        <dd className="font-medium">{student.phone}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400">Date of Birth</dt>
                                        <dd className="font-medium">{student.dateOfBirth}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Academic Overview */}
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Academic Overview</h2>
                                <dl className="mt-4 space-y-4 text-sm text-gray-700">
                                    <div>
                                        <dt className="text-gray-400">Cumulative Performance Index (CPI)</dt>
                                        <dd className="font-medium text-lg text-blue-700">{student.cpi.toFixed(2)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400">Education Path</dt>
                                        <dd className="font-medium">{student.isD2D ? 'Diploma to Degree (D2D)' : 'Standard (12th)'}</dd>
                                    </div>
                                </dl>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Academics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                    <Card>
                        <CardHeader><h3 className="font-semibold text-gray-900">10th Standard</h3></CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <p className="text-xs text-gray-500">Overall Percentage</p>
                                <p className="text-2xl font-semibold text-gray-900">{student.percentage10th}%</p>
                            </div>
                            {student.subjects10th && student.subjects10th.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-medium text-gray-500">Subject Marks</p>
                                    <ul className="rounded-md border border-gray-100 bg-gray-50 p-3">
                                        {student.subjects10th.map((sub, i) => (
                                            <li key={i} className="flex justify-between py-1 text-sm text-gray-700">
                                                <span>{sub.name}</span>
                                                <span className="font-medium">{sub.marks}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {student.isD2D ? (
                        <Card>
                            <CardHeader><h3 className="font-semibold text-gray-900">Diploma Details</h3></CardHeader>
                            <CardContent>
                                <div>
                                    <p className="text-xs text-gray-500">D2D CGPA</p>
                                    <p className="text-2xl font-semibold text-gray-900">{student.d2dCgpa ?? 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader><h3 className="font-semibold text-gray-900">12th Standard</h3></CardHeader>
                            <CardContent>
                                <div>
                                    <p className="text-xs text-gray-500">Overall Percentage</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {student.percentage12th ? `${student.percentage12th}%` : 'N/A'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div>

            </div>
        </main>
    );
}
