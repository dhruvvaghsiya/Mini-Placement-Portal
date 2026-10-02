'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { ROUTES } from '@/lib';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.STUDENT) router.replace(ROUTES.TPO.DASHBOARD);
  }, [user, authLoading, router]);

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
    <main className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
      <p className="mt-2 text-gray-500">
        Your placement activity overview will appear here.
      </p>
    </main>
  );
}
