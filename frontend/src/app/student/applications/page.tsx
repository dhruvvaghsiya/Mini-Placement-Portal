'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { applicationApi } from '@/lib/api';
import type { Application } from '@/types';
import { Role, ApplicationStatus } from '@/types';
import { ROUTES, formatDate } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

// ─── Status configuration ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { variant: 'info' | 'success' | 'danger' | 'warning' | 'default'; label: string }
> = {
  [ApplicationStatus.APPLIED]: { variant: 'info', label: 'Applied' },
  [ApplicationStatus.SHORTLISTED]: { variant: 'warning', label: 'Shortlisted' },
  [ApplicationStatus.REJECTED]: { variant: 'danger', label: 'Rejected' },
  [ApplicationStatus.SELECTED]: { variant: 'success', label: 'Selected' },
};

// ─── Application card ─────────────────────────────────────────────────────────

function ApplicationCard({ application }: { application: Application }) {
  const drive = application.drive;
  const statusCfg = STATUS_CONFIG[application.status] ?? {
    variant: 'default' as const,
    label: application.status,
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Drive info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {drive?.title ?? `Drive #${application.driveId.slice(0, 8)}`}
            </h3>
            <Badge label={statusCfg.label} variant={statusCfg.variant} />
          </div>

          {drive?.company && (
            <p className="mt-0.5 text-sm font-medium text-blue-600">
              {drive.company.name}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {drive?.role && (
              <span>
                <span className="font-medium text-gray-700">Role:</span> {drive.role}
              </span>
            )}
            {drive?.ctc && (
              <span>
                <span className="font-medium text-gray-700">CTC:</span> {drive.ctc}
              </span>
            )}
            {drive?.location && (
              <span>
                <span className="font-medium text-gray-700">Location:</span> {drive.location}
              </span>
            )}
          </div>
        </div>

        {/* Applied date */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">Applied</p>
          <p className="text-sm font-medium text-gray-700">
            {formatDate(application.appliedAt)}
          </p>
        </div>
      </div>

      {/* Status context message */}
      {application.status === ApplicationStatus.SHORTLISTED && (
        <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          🎉 You have been shortlisted. Watch for further communication from the placement cell.
        </p>
      )}
      {application.status === ApplicationStatus.SELECTED && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          🏆 Congratulations! You have been selected for this role.
        </p>
      )}
      {application.status === ApplicationStatus.REJECTED && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Your application was not shortlisted for this drive. Keep applying!
        </p>
      )}
    </div>
  );
}

// ─── Status summary strip ─────────────────────────────────────────────────────

function StatusSummary({ applications }: { applications: Application[] }) {
  const counts = {
    [ApplicationStatus.APPLIED]: 0,
    [ApplicationStatus.SHORTLISTED]: 0,
    [ApplicationStatus.SELECTED]: 0,
    [ApplicationStatus.REJECTED]: 0,
  };
  for (const app of applications) {
    if (app.status in counts) counts[app.status as keyof typeof counts]++;
  }

  const items = [
    { label: 'Applied', count: counts[ApplicationStatus.APPLIED], color: 'text-blue-600 bg-blue-50' },
    { label: 'Shortlisted', count: counts[ApplicationStatus.SHORTLISTED], color: 'text-yellow-700 bg-yellow-50' },
    { label: 'Selected', count: counts[ApplicationStatus.SELECTED], color: 'text-green-700 bg-green-50' },
    { label: 'Rejected', count: counts[ApplicationStatus.REJECTED], color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, count, color }) => (
        <div
          key={label}
          className={`flex flex-col items-center rounded-xl px-4 py-3 ${color}`}
        >
          <span className="text-2xl font-bold">{count}</span>
          <span className="mt-0.5 text-xs font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg className="h-7 w-7 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">No applications yet</p>
      <p className="mt-1 text-sm text-gray-400">Browse drives and apply to get started.</p>
      <Link href={ROUTES.STUDENT.DRIVES} className="mt-4">
        <Button size="sm" variant="primary">Browse Drives</Button>
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentApplicationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.STUDENT) router.replace(ROUTES.TPO.DASHBOARD);
  }, [user, authLoading, router]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || user.role !== Role.STUDENT) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await applicationApi.myApplications();
        if (!cancelled) setApplications(data);
      } catch {
        if (!cancelled) setError('Failed to load applications. Please refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // ── Auth loading guard ─────────────────────────────────────────────────────
  if (authLoading || !user || user.role !== Role.STUDENT) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track the status of all your placement applications.
            </p>
          </div>
          <Link href={ROUTES.STUDENT.DRIVES}>
            <Button variant="ghost" size="sm">← Browse Drives</Button>
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-blue-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-blue-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
            >
              Refresh page
            </button>
          </div>
        )}

        {/* Summary + list */}
        {!loading && !error && applications.length > 0 && (
          <>
            <StatusSummary applications={applications} />
            <div className="space-y-4">
              {applications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          </>
        )}

        {/* Empty */}
        {!loading && !error && applications.length === 0 && <EmptyState />}
      </div>
    </main>
  );
}
