'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { companyApi, ApiError } from '@/lib/api';
import type { Company } from '@/types';
import { Role } from '@/types';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

// ─── Validation schema ────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  logoUrl: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
  description: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

// ─── Company Card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Logo / Avatar */}
      <div className="shrink-0">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`${company.name} logo`}
            className="h-12 w-12 rounded-lg object-cover ring-1 ring-gray-100"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('hidden');
            }}
          />
        ) : null}
        <div
          hidden={!!company.logoUrl}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white"
        >
          {initials}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{company.name}</p>
        <p className="mt-0.5 text-sm text-gray-500">{company.industry}</p>
        {company.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">
            {company.description}
          </p>
        )}
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg className="h-7 w-7 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">No companies yet</p>
      <p className="mt-1 text-sm text-gray-400">Add your first company using the form above.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TpoCompaniesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // ── Companies list state ───────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
  });

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (user.role !== Role.TPO) {
      router.replace(ROUTES.STUDENT.DASHBOARD);
    }
  }, [user, authLoading, router]);

  // ── Fetch companies ───────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || user.role !== Role.TPO) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await companyApi.list();
        if (!cancelled) setCompanies(data);
      } catch {
        if (!cancelled) setListError('Failed to load companies. Please refresh.');
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // ── Submit new company ────────────────────────────────────────────────────
  const onSubmit = async (values: CompanyFormValues) => {
    setApiError(null);
    setSuccessMsg(null);
    try {
      const created = await companyApi.create({
        name: values.name,
        industry: values.industry,
        logoUrl: values.logoUrl || undefined,
        website: values.website || undefined,
        description: values.description || undefined,
      });
      setCompanies((prev) => [created, ...prev]);
      setSuccessMsg(`"${created.name}" added successfully.`);
      reset();
      setFormOpen(false);
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  // ── Auth / loading guards ──────────────────────────────────────────────────
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
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage partner companies available for recruitment drives.
            </p>
          </div>
          <Button
            id="toggle-add-company"
            variant={formOpen ? 'secondary' : 'primary'}
            size="md"
            onClick={() => {
              setFormOpen((v) => !v);
              setApiError(null);
              setSuccessMsg(null);
              if (formOpen) reset();
            }}
          >
            {formOpen ? (
              'Cancel'
            ) : (
              <>
                <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Company
              </>
            )}
          </Button>
        </div>

        {/* ── Success banner ──────────────────────────────────────────────── */}
        {successMsg && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5"
          >
            <svg className="h-4 w-4 shrink-0 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-700">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg(null)}
              className="ml-auto text-green-500 hover:text-green-700"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Add Company form ────────────────────────────────────────────── */}
        {formOpen && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900">Add a new company</h2>
            </CardHeader>
            <CardContent>
              <form
                id="add-company-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    id="company-name"
                    label="Company name"
                    type="text"
                    placeholder="e.g. Infosys"
                    required
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    id="company-industry"
                    label="Industry"
                    type="text"
                    placeholder="e.g. Information Technology"
                    required
                    error={errors.industry?.message}
                    {...register('industry')}
                  />
                  <Input
                    id="company-logo-url"
                    label="Logo image URL"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    hint="Optional — publicly accessible image URL"
                    error={errors.logoUrl?.message}
                    {...register('logoUrl')}
                  />
                  <Input
                    id="company-website"
                    label="Website"
                    type="url"
                    placeholder="https://example.com"
                    hint="Optional"
                    error={errors.website?.message}
                    {...register('website')}
                  />
                </div>

                <Input
                  id="company-description"
                  label="Description"
                  type="text"
                  placeholder="Brief description of the company…"
                  hint="Optional"
                  error={errors.description?.message}
                  {...register('description')}
                />

                <FormError message={apiError} />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      reset();
                      setFormOpen(false);
                      setApiError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="company-submit"
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Adding…
                      </>
                    ) : (
                      'Add Company'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Companies list ──────────────────────────────────────────────── */}
        <section aria-label="Company list">
          {/* Header row */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {listLoading
                ? 'Loading…'
                : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`}
            </h2>
          </div>

          {/* Loading skeleton */}
          {listLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!listLoading && listError && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12 text-center">
              <svg className="mb-3 h-8 w-8 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{listError}</p>
              <button
                onClick={() => {
                  setListError(null);
                  setListLoading(true);
                  companyApi
                    .list()
                    .then(setCompanies)
                    .catch(() => setListError('Failed to load companies. Please refresh.'))
                    .finally(() => setListLoading(false));
                }}
                className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!listLoading && !listError && companies.length === 0 && <EmptyState />}

          {/* Grid of company cards */}
          {!listLoading && !listError && companies.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
