'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { dashboardApi } from '@/lib/api';
import type { TpoDashboardStats } from '@/types';
import { Role } from '@/types';
import { ROUTES } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';

// ─── Reusable Stat Card ───────────────────────────────────────────────────────

function StatCard({ title, value, loading, colorClass = 'text-blue-600' }: { title: string, value?: number, loading: boolean, colorClass?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="mt-2 flex items-baseline">
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className={`text-3xl font-semibold ${colorClass}`}>
              {value ?? 0}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActionCard({ title, description, href, icon }: { title: string, description: string, href: string, icon: React.ReactNode }) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full transition duration-150 ease-in-out group-hover:border-blue-500 group-hover:shadow-md">
        <CardContent className="flex items-start p-6">
          <div className="shrink-0 text-blue-500 group-hover:text-blue-600">
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TpoDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<TpoDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.TPO) router.replace(ROUTES.STUDENT.DASHBOARD);
  }, [user, authLoading, router]);

  // ── Fetch ──
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getTpoStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== Role.TPO) return;
    fetchStats();
  }, [authLoading, user]);

  // ── Initial block ──
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

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">TPO Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of placements, active drives, and student metrics.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="shrink-0 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 flex justify-between items-center">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <button onClick={fetchStats} className="text-sm underline text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600">
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={stats?.totalStudents} loading={loading} colorClass="text-gray-900" />
          <StatCard title="Verified Students" value={stats?.verifiedStudents} loading={loading} colorClass="text-green-600" />
          <StatCard title="Total Companies" value={stats?.totalCompanies} loading={loading} colorClass="text-purple-600" />
          <StatCard title="Active Drives" value={stats?.activeDrives} loading={loading} colorClass="text-indigo-600" />
          <StatCard title="Total Applications" value={stats?.totalApplications} loading={loading} colorClass="text-blue-600" />
          <StatCard title="Shortlisted" value={stats?.shortlistedApplications} loading={loading} colorClass="text-orange-500" />
          <StatCard title="Selected" value={stats?.selectedApplications} loading={loading} colorClass="text-emerald-500" />
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-start">
            <span className="bg-gray-50 pr-3 text-lg font-semibold text-gray-900">Quick Actions</span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Manage Students"
            description="View profiles, stats, and verify students"
            href={ROUTES.TPO.STUDENTS}
            icon={(
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          />
          <QuickActionCard
            title="Manage Companies"
            description="Add recruiting companies and view details"
            href={ROUTES.TPO.COMPANIES}
            icon={(
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          />
          <QuickActionCard
            title="Recruitment Drives"
            description="Create drives, set eligibility and roles"
            href={ROUTES.TPO.DRIVES}
            icon={(
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          />
          <QuickActionCard
            title="Monitor Applications"
            description="Review active applications and shortlist"
            href={ROUTES.TPO.APPLICATIONS}
            icon={(
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            )}
          />
        </div>

      </div>
    </main>
  );
}
