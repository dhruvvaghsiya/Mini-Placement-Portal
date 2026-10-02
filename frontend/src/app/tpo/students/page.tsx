<<<<<<< HEAD
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { studentApi } from '@/lib/api';
import type { StudentProfile } from '@/types';
import { Role } from '@/types';
import { ROUTES } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

// ─── Status badges ────────────────────────────────────────────────────────────

function VerificationBadge({ isVerified }: { isVerified?: boolean }) {
  if (isVerified) {
    return <Badge label="Verified" variant="success" />;
  }
  return <Badge label="Unverified" variant="warning" />;
}

function ProfileStatusBadge({ locked }: { locked: boolean }) {
  if (locked) {
    return <Badge label="Locked" variant="info" />;
  }
  return <Badge label="Draft" variant="default" />;
}

// ─── Filters interface ────────────────────────────────────────────────────────

interface Filters {
  search: string;
  verificationStr: 'all' | 'verified' | 'unverified';
  minCpi: string;
  min10th: string;
}

export default function TpoStudentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    verificationStr: 'all',
    minCpi: '',
    min10th: '',
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.TPO) router.replace(ROUTES.STUDENT.DASHBOARD);
  }, [user, authLoading, router]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || user.role !== Role.TPO) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await studentApi.listAll();
        if (!cancelled) setStudents(data);
      } catch {
        if (!cancelled) setError('Failed to load students. Please refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search (Name or Email)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchEmail = s.email.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      // Verification
      if (filters.verificationStr === 'verified' && !s.isVerified) return false;
      if (filters.verificationStr === 'unverified' && s.isVerified) return false;

      // Min CPI
      if (filters.minCpi) {
        const target = parseFloat(filters.minCpi);
        if (!isNaN(target) && s.cpi < target) return false;
      }

      // Min 10th
      if (filters.min10th) {
        const target = parseFloat(filters.min10th);
        if (!isNaN(target) && s.percentage10th < target) return false;
      }

      return true;
    });
  }, [students, filters]);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student profiles and review academic details.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700">Search</label>
              <input
                type="text"
                id="search"
                placeholder="Name or email..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="verificationStr" className="block text-xs font-medium text-gray-700">Verification Status</label>
              <select
                id="verificationStr"
                value={filters.verificationStr}
                onChange={(e) => setFilters(f => ({ ...f, verificationStr: e.target.value as any }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div>
              <label htmlFor="minCpi" className="block text-xs font-medium text-gray-700">Min CPI</label>
              <input
                type="number"
                id="minCpi"
                placeholder="e.g. 7.5"
                step="0.01"
                min="0"
                max="10"
                value={filters.minCpi}
                onChange={(e) => setFilters(f => ({ ...f, minCpi: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="min10th" className="block text-xs font-medium text-gray-700">Min 10th %</label>
              <input
                type="number"
                id="min10th"
                placeholder="e.g. 60"
                step="0.1"
                min="0"
                max="100"
                value={filters.min10th}
                onChange={(e) => setFilters(f => ({ ...f, min10th: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="animate-pulse p-4">
              <div className="h-4 w-1/4 rounded bg-gray-200 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-full rounded bg-gray-100" />
                ))}
              </div>
            </div>
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

        {/* List table */}
        {!loading && !error && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Profile</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Verification</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">10th %</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">12th / D2D</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">CPI</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                        No students found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <ProfileStatusBadge locked={student.profileLocked} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <VerificationBadge isVerified={student.isVerified} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {student.percentage10th}%
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {student.isD2D ? (
                            <span className="text-gray-500" title="D2D CGPA">
                              D2D: <span className="font-medium text-gray-900">{student.d2dCgpa ?? 'N/A'}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500" title="12th Percentage">
                              12th: <span className="font-medium text-gray-900">{student.percentage12th ? `${student.percentage12th}%` : 'N/A'}</span>
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                          {student.cpi.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Link href={`${ROUTES.TPO.STUDENTS}/${student.id}`}>
                            <Button variant="secondary" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <p className="text-xs text-gray-500">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>
          </div>
        )}

      </div>
=======
export default function TpoStudentsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Students</h1>
      <p className="mt-2 text-gray-500">
        Manage and view all registered students here.
      </p>
>>>>>>> main
    </main>
  );
}
