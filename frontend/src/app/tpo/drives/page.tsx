'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { driveApi, companyApi, ApiError } from '@/lib/api';
import type { RecruitmentDrive, Company } from '@/types';
import { Role, DriveStatus } from '@/types';
import { ROUTES, formatDate } from '@/lib';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';

// ─── Validation schema ────────────────────────────────────────────────────────

const numericOptional = z.string().optional();

const driveSchema = z.object({
  title: z.string().min(1, 'Drive title is required'),
  companyId: z.string().min(1, 'Please select a company'),
  role: z.string().min(1, 'Role / job title is required'),
  ctc: z.string().min(1, 'CTC / package is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  driveDate: z.string().min(1, 'Drive date is required'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  minPercentage10th: numericOptional,
  minPercentage12th: numericOptional,
  minD2dCgpa: numericOptional,
  minCpi: numericOptional,
});

type DriveFormValues = z.infer<typeof driveSchema>;

// Helper to parse optional numeric string
const toNum = (v?: string) =>
  v === undefined || v === '' ? undefined : parseFloat(v);

// ─── Status badge helper ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  { variant: 'info' | 'success' | 'default'; label: string }
> = {
  [DriveStatus.UPCOMING]: { variant: 'info', label: 'Upcoming' },
  [DriveStatus.ONGOING]: { variant: 'success', label: 'Ongoing' },
  [DriveStatus.COMPLETED]: { variant: 'default', label: 'Completed' },
};

// ─── Drive row card ───────────────────────────────────────────────────────────

function DriveRow({ drive }: { drive: RecruitmentDrive }) {
  const badge = STATUS_BADGE[drive.status] ?? { variant: 'default', label: drive.status };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{drive.title}</h3>
            <Badge label={badge.label} variant={badge.variant} />
          </div>
          {drive.company && (
            <p className="mt-0.5 text-sm text-gray-500">{drive.company.name}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-blue-700">{drive.ctc}</p>
          <p className="mt-0.5 text-xs text-gray-400">{drive.location}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-gray-600">{drive.description}</p>

      {/* Role */}
      <p className="mt-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Role:</span> {drive.role}
      </p>

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

      {/* Eligibility chips */}
      {(drive.minCpi ||
        drive.minPercentage10th ||
        drive.minPercentage12th ||
        drive.minD2dCgpa) && (
          <div className="mt-3 flex flex-wrap gap-2">
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
                D2D CGPA ≥ {drive.minD2dCgpa}
              </span>
            )}
            {drive.minCpi !== undefined && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                CPI ≥ {drive.minCpi}
              </span>
            )}
          </div>
        )}
    </div>
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
      <p className="text-sm font-medium text-gray-700">No recruitment drives yet</p>
      <p className="mt-1 text-sm text-gray-400">Create your first drive using the form above.</p>
    </div>
  );
}

// ─── Number input helper (react-hook-form compatible) ─────────────────────────

function NumberInput({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string | number | undefined;
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      label={label}
      type="number"
      min={min}
      max={max}
      step={step ?? 0.01}
      placeholder={placeholder}
      hint={hint}
      error={error}
      value={value ?? ''}
      onChange={(e) =>
        onChange(e.target.value === '' ? '' : parseFloat(e.target.value))
      }
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TpoDrivesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DriveFormValues>({
    resolver: zodResolver(driveSchema),
    defaultValues: {
      companyId: '',
    },
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.role !== Role.TPO) router.replace(ROUTES.STUDENT.DASHBOARD);
  }, [user, authLoading, router]);

  // ── Fetch drives + companies in parallel ───────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || user.role !== Role.TPO) return;
    let cancelled = false;
    (async () => {
      try {
        const [drivesData, companiesData] = await Promise.all([
          driveApi.list(),
          companyApi.list(),
        ]);
        if (!cancelled) {
          setDrives(drivesData);
          setCompanies(companiesData);
        }
      } catch {
        if (!cancelled) setListError('Failed to load data. Please refresh.');
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (values: DriveFormValues) => {
    setApiError(null);
    setSuccessMsg(null);
    try {
      const created = await driveApi.create({
        title: values.title,
        companyId: values.companyId,
        role: values.role,
        ctc: values.ctc,
        location: values.location,
        description: values.description,
        driveDate: values.driveDate,
        applicationDeadline: values.applicationDeadline,
        minPercentage10th: toNum(values.minPercentage10th),
        minPercentage12th: toNum(values.minPercentage12th),
        minD2dCgpa: toNum(values.minD2dCgpa),
        minCpi: toNum(values.minCpi),
      });
      // Attach company object for display
      const company = companies.find((c) => c.id === created.companyId);
      setDrives((prev) => [{ ...created, company }, ...prev]);
      setSuccessMsg(`Drive "${created.title}" created successfully.`);
      reset();
      setFormOpen(false);
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
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

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruitment Drives</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage placement drives for eligible students.
            </p>
          </div>
          <Button
            id="toggle-create-drive"
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
                Create Drive
              </>
            )}
          </Button>
        </div>

        {/* ── Success banner ────────────────────────────────────────────────── */}
        {successMsg && (
          <div role="status" className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5">
            <svg className="h-4 w-4 shrink-0 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-700">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-500 hover:text-green-700" aria-label="Dismiss">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Create Drive form ─────────────────────────────────────────────── */}
        {formOpen && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900">Create a new recruitment drive</h2>
            </CardHeader>
            <CardContent>
              <form id="create-drive-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

                {/* Basic info */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    id="drive-title"
                    label="Drive title"
                    type="text"
                    placeholder="e.g. Campus Hiring 2025"
                    required
                    error={errors.title?.message}
                    {...register('title')}
                  />

                  <Controller
                    control={control}
                    name="companyId"
                    render={({ field }) => (
                      <Select
                        id="drive-company"
                        label="Company"
                        required
                        placeholder="— Select a company —"
                        options={companyOptions}
                        error={errors.companyId?.message}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <Input
                    id="drive-role"
                    label="Role / job title"
                    type="text"
                    placeholder="e.g. Software Engineer"
                    required
                    error={errors.role?.message}
                    {...register('role')}
                  />

                  <Input
                    id="drive-ctc"
                    label="CTC / package"
                    type="text"
                    placeholder="e.g. ₹8 LPA"
                    required
                    error={errors.ctc?.message}
                    {...register('ctc')}
                  />

                  <Input
                    id="drive-location"
                    label="Location"
                    type="text"
                    placeholder="e.g. Bangalore"
                    required
                    error={errors.location?.message}
                    {...register('location')}
                  />
                </div>

                <Input
                  id="drive-description"
                  label="Description"
                  type="text"
                  placeholder="Brief description of the drive and roles offered…"
                  required
                  error={errors.description?.message}
                  {...register('description')}
                />

                {/* Dates */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    id="drive-date"
                    label="Drive date"
                    type="date"
                    required
                    error={errors.driveDate?.message}
                    {...register('driveDate')}
                  />
                  <Input
                    id="drive-deadline"
                    label="Application deadline"
                    type="date"
                    required
                    error={errors.applicationDeadline?.message}
                    {...register('applicationDeadline')}
                  />
                </div>

                {/* Eligibility */}
                <fieldset className="rounded-lg border border-gray-200 p-4">
                  <legend className="px-1 text-sm font-semibold text-gray-700">
                    Minimum eligibility criteria
                    <span className="ml-1 text-xs font-normal text-gray-400">(leave blank for no minimum)</span>
                  </legend>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <Controller
                      control={control}
                      name="minPercentage10th"
                      render={({ field }) => (
                        <NumberInput
                          id="drive-min-10th"
                          label="Min. 10th percentage"
                          placeholder="e.g. 60"
                          hint="Out of 100"
                          min={0}
                          max={100}
                          error={errors.minPercentage10th?.message as string | undefined}
                          value={field.value as number | '' | undefined}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="minPercentage12th"
                      render={({ field }) => (
                        <NumberInput
                          id="drive-min-12th"
                          label="Min. 12th percentage"
                          placeholder="e.g. 60"
                          hint="Out of 100 (non-D2D only)"
                          min={0}
                          max={100}
                          error={errors.minPercentage12th?.message as string | undefined}
                          value={field.value as number | '' | undefined}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="minD2dCgpa"
                      render={({ field }) => (
                        <NumberInput
                          id="drive-min-d2d"
                          label="Min. D2D diploma CGPA"
                          placeholder="e.g. 6.5"
                          hint="Out of 10 (D2D only)"
                          min={0}
                          max={10}
                          error={errors.minD2dCgpa?.message as string | undefined}
                          value={field.value as number | '' | undefined}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="minCpi"
                      render={({ field }) => (
                        <NumberInput
                          id="drive-min-cpi"
                          label="Min. CPI / college CGPA"
                          placeholder="e.g. 6.0"
                          hint="Out of 10"
                          min={0}
                          max={10}
                          error={errors.minCpi?.message as string | undefined}
                          value={field.value as number | '' | undefined}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </fieldset>

                <FormError message={apiError} />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { reset(); setFormOpen(false); setApiError(null); }}
                  >
                    Cancel
                  </Button>
                  <Button id="drive-submit" type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating…
                      </>
                    ) : 'Create Drive'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Drives list ───────────────────────────────────────────────────── */}
        <section aria-label="Recruitment drives list">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              {listLoading ? 'Loading…' : `${drives.length} ${drives.length === 1 ? 'drive' : 'drives'}`}
            </h2>
          </div>

          {/* Loading skeleton */}
          {listLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!listLoading && listError && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12 text-center">
              <p className="text-sm font-medium text-red-700">{listError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
              >
                Refresh page
              </button>
            </div>
          )}

          {/* Empty */}
          {!listLoading && !listError && drives.length === 0 && <EmptyState />}

          {/* Drive list */}
          {!listLoading && !listError && drives.length > 0 && (
            <div className="space-y-4">
              {drives.map((drive) => (
                <DriveRow key={drive.id} drive={drive} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
