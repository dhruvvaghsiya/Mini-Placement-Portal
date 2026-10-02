'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { applicationApi } from '@/lib/api';
import type { Application, ApplicationStatus } from '@/types';
import { Role } from '@/types';
import { ROUTES } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ApplicationStatus }) {
  switch (status) {
    case 'APPLIED':
      return <Badge label="Applied" variant="default" />;
    case 'SHORTLISTED':
      return <Badge label="Shortlisted" variant="info" />;
    case 'SELECTED':
      return <Badge label="Selected" variant="success" />;
    case 'REJECTED':
      return <Badge label="Rejected" variant="warning" />;
    default:
      return <Badge label={status} variant="default" />;
  }
}

export default function TpoApplicationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status map to track loading/error per application
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [updateError, setUpdateError] = useState<Record<string, string>>({});
  const [updateSuccess, setUpdateSuccess] = useState<Record<string, boolean>>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.TPO) { router.replace(ROUTES.STUDENT.DASHBOARD); return; }
  }, [user, authLoading, router]);

  // ── Fetch applications ──────────────────────────────────────────────────────
  const fetchApplications = async () => {
    try {
      setError(null);
      const data = await applicationApi.listAllTpo();
      setApplications(data);
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== Role.TPO) return;
    fetchApplications();
  }, [authLoading, user]);


  // ── Status update ───────────────────────────────────────────────────────────
  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdating(prev => ({ ...prev, [appId]: true }));
    setUpdateError(prev => ({ ...prev, [appId]: '' }));
    setUpdateSuccess(prev => ({ ...prev, [appId]: false }));
    try {
      const updatedApp = await applicationApi.updateStatus(appId, newStatus);
      // Refresh the affected application by merging it into the list
      setApplications(apps => apps.map(app => (app.id === appId ? updatedApp : app)));
      setUpdateSuccess(prev => ({ ...prev, [appId]: true }));

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(prev => ({ ...prev, [appId]: false }));
      }, 3000);
    } catch (err: any) {
      const message = err.message || 'Update failed';
      setUpdateError(prev => ({ ...prev, [appId]: message }));
    } finally {
      setUpdating(prev => ({ ...prev, [appId]: false }));
    }
  };

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filteredApplications = useMemo(() => {
    if (statusFilter === 'ALL') return applications;
    return applications.filter(app => app.status === statusFilter);
  }, [applications, statusFilter]);

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
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Monitoring</h1>
            <p className="mt-2 text-sm text-gray-700">
              Overview of all student applications for recruitment drives. Manage their statuses here.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'ALL')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPLIED">Applied</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchApplications}
              className="mt-4 sm:mt-0 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Refresh Data
            </button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-full bg-gray-200 rounded"></div>
            <div className="h-12 w-full bg-gray-200 rounded"></div>
            <div className="h-12 w-full bg-gray-200 rounded"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 text-center">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <button onClick={fetchApplications} className="mt-2 text-sm text-red-700 underline hover:text-red-900">Try again</button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-md bg-white p-8 border border-gray-200 text-center shadow-sm">
            <h3 className="text-sm font-medium text-gray-900">No applications found.</h3>
            <p className="mt-1 text-sm text-gray-500">Wait for students to start applying to recruitment drives.</p>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company & Role</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">CTC</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Applied Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="relative px-3 py-3.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{(app as any).studentName || app.student?.fullName || 'Unknown Student'}</span>
                        <span className="text-sm text-gray-500">{(app as any).studentEmail || 'Unknown Email'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{(app as any).companyName || app.drive?.company?.name || 'Unknown Company'}</span>
                        <span className="text-sm text-gray-500">{(app as any).role || app.drive?.role || 'Unknown Role'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(app as any).ctc || app.drive?.ctc || 'N/A'} LPA
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-3 py-4 text-sm font-medium min-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <select
                          value={app.status}
                          disabled={updating[app.id]}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="SELECTED">Selected</option>
                          <option value="REJECTED">Rejected</option>
                        </select>

                        {updating[app.id] && <span className="text-xs text-blue-600 animate-pulse">Updating...</span>}
                        {updateSuccess[app.id] && <span className="text-xs text-green-600">Successfully updated</span>}
                        {updateError[app.id] && <span className="text-xs text-red-600 break-words max-w-[150px]">{updateError[app.id]}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
