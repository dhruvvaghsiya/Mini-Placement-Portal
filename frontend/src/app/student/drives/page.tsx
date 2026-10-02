'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { driveApi, applicationApi, ApiError } from '@/lib/api';
import type { RecruitmentDrive, Application } from '@/types';
import { Role, ApplicationStatus, DriveStatus } from '@/types';
import { ROUTES, formatDate } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

// Map driveId → application (for "already applied" check)
type ApplicationMap = Record<string, Application>;

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  { variant: 'info' | 'success' | 'danger' | 'warning' | 'default'; label: string }
> = {
  [ApplicationStatus.APPLIED]: { variant: 'info', label: 'Applied' },
  [ApplicationStatus.SHORTLISTED]: { variant: 'warning', label: 'Shortlisted' },
  [ApplicationStatus.REJECTED]: { variant: 'danger', label: 'Rejected' },
  [ApplicationStatus.SELECTED]: { variant: 'success', label: 'Selected' },
};

const DRIVE_STATUS_BADGE: Record<
  string,
  { variant: 'info' | 'success' | 'default'; label: string }
> = {
  [DriveStatus.UPCOMING]: { variant: 'info', label: 'Upcoming' },
  [DriveStatus.ONGOING]: { variant: 'success', label: 'Ongoing' },
  [DriveStatus.COMPLETED]: { variant: 'default', label: 'Completed' },
};

// ─── Apply button (with per-drive state) ──────────────────────────────────────

function ApplyButton({
  drive,
  existingApplication,
  onApplied,
}: {
  drive: RecruitmentDrive;
  existingApplication?: Application;
  onApplied: (app: Application) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (existingApplication) {
    const badge = STATUS_BADGE[existingApplication.status] ?? {
      variant: 'default' as const,
      label: existingApplication.status,
    };
    return <Badge label={badge.label} variant={badge.variant} />;
  }

  if (drive.status === DriveStatus.COMPLETED) {
    return (
      <span className="text-xs text-gray-400 italic">Drive closed</span>
    );
  }

  if (success) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Applied!
      </span>
    );
  }

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      const app = await applicationApi.apply(drive.id);
      setSuccess(true);
      onApplied(app);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not apply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        id={`apply-drive-${drive.id}`}
        size="sm"
        variant="primary"
        disabled={loading}
        onClick={handleApply}
      >
        {loading ? (
          <>
            <svg className="mr-1.5 h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Applying…
          </>
        ) : 'Apply'}
      </Button>
      {error && (
        <p className="text-right text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

// ─── Drive card ───────────────────────────────────────────────────────────────

function DriveCard({
  drive,
  application,
  onApplied,
}: {
  drive: RecruitmentDrive;
  application?: Application;
  onApplied: (app: Application) => void;
}) {
  const driveBadge = DRIVE_STATUS_BADGE[drive.status] ?? { variant: 'default' as const, label: drive.status };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Left: drive info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{drive.title}</h3>
              <Badge label={driveBadge.label} variant={driveBadge.variant} />
            </div>
            {drive.company && (
              <p className="mt-0.5 text-sm font-medium text-blue-600">
                {drive.company.name}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>
                <span className="font-medium text-gray-700">Role:</span> {drive.role}
              </span>
              <span>
                <span className="font-medium text-gray-700">CTC:</span> {drive.ctc}
              </span>
              <span>
                <span className="font-medium text-gray-700">Location:</span> {drive.location}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-gray-500">{drive.description}</p>

            {/* Eligibility chips */}
            {(drive.minPercentage10th || drive.minPercentage12th || drive.minD2dCgpa || drive.minCpi) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {drive.minPercentage10th !== undefined && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    10th ≥ {drive.minPercentage10th}%
                  </span>
                )}
                {drive.minPercentage12th !== undefined && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    12th ≥ {drive.minPercentage12th}%
                  </span>
                )}
                {drive.minD2dCgpa !== undefined && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    D2D ≥ {drive.minD2dCgpa}
                  </span>
                )}
                {drive.minCpi !== undefined && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    CPI ≥ {drive.minCpi}
                  </span>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>
                <span className="font-medium text-gray-700">Drive date:</span>{' '}
                {formatDate(drive.driveDate)}
              </span>
              <span>
                <span className="font-medium text-gray-700">Deadline:</span>{' '}
                {formatDate(drive.applicationDeadline)}
              </span>
            </div>
          </div>

          {/* Right: action */}
          <div className="flex shrink-0 items-center">
            <ApplyButton
              drive={drive}
              existingApplication={application}
              onApplied={onApplied}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg className="h-7 w-7 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">No open drives right now</p>
      <p className="mt-1 text-sm text-gray-400">Check back later for new recruitment drives.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDrivesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [applicationMap, setApplicationMap] = useState<ApplicationMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.STUDENT) router.replace(ROUTES.TPO.DASHBOARD);
  }, [user, authLoading, router]);

  // ── Fetch drives + my applications in parallel ─────────────────────────────
  useEffect(() => {
    if (authLoading || !user || user.role !== Role.STUDENT) return;
    let cancelled = false;
    (async () => {
      try {
        const [drivesData, appsData] = await Promise.all([
          driveApi.list(),
          applicationApi.myApplications(),
        ]);
        if (!cancelled) {
          setDrives(drivesData);
          // Build lookup map: driveId → application
          const map: ApplicationMap = {};
          for (const app of appsData) {
            map[app.driveId] = app;
          }
          setApplicationMap(map);
        }
      } catch {
        if (!cancelled) setError('Failed to load drives. Please refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // When student applies, add to map immediately
  const handleApplied = (app: Application) => {
    setApplicationMap((prev) => ({ ...prev, [app.driveId]: app }));
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Recruitment Drives</h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse open drives and apply directly below.
            </p>
          </div>
          <Link href={ROUTES.STUDENT.APPLICATIONS}>
            <Button variant="ghost" size="sm">My Applications →</Button>
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
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="h-8 w-20 animate-pulse rounded-md bg-blue-100" />
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

        {/* Count */}
        {!loading && !error && (
          <p className="text-sm text-gray-400">
            {drives.length} {drives.length === 1 ? 'drive' : 'drives'} available
          </p>
        )}

        {/* Empty */}
        {!loading && !error && drives.length === 0 && <EmptyState />}

        {/* Drive cards */}
        {!loading && !error && drives.map((drive) => (
          <DriveCard
            key={drive.id}
            drive={drive}
            application={applicationMap[drive.id]}
            onApplied={handleApplied}
          />
        ))}
      </div>
    </main>
  );
}
