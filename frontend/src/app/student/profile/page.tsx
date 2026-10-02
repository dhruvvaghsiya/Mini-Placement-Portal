'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  studentApi,
  StudentProfileResponse,
  ApiError,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormSection from '@/components/ui/FormSection';
import FormError from '@/components/ui/FormError';
import ProfileLockedBanner from '@/components/ui/ProfileLockedBanner';

// ─── Default 10th subjects ────────────────────────────────────────────────────

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Social Studies',
  'Second Language',
];

// ─── Validation schema ────────────────────────────────────────────────────────

const markSchema = z
  .number()
  .min(0, 'Min 0')
  .max(100, 'Max 100');

const profileSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z
      .string()
      .min(10, 'Enter a valid phone number')
      .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),

    subjects10th: z.array(
      z.object({
        name: z.string(),
        marks: markSchema,
      }),
    ),
    percentage10th: z.number().min(0).max(100),

    isD2D: z.enum(['yes', 'no']),

    d2dCgpa: z.number().min(0, 'Min 0').max(10, 'Max 10').optional(),
    percentage12th: z.number().min(0).max(100).optional(),

    cpi: z
      .number()
      .min(0, 'Min 0')
      .max(10, 'Max 10'),
  })
  .superRefine((data, ctx) => {
    if (data.isD2D === 'yes') {
      if (data.d2dCgpa === undefined || data.d2dCgpa === null) {
        ctx.addIssue({ code: 'custom', path: ['d2dCgpa'], message: 'D2D CGPA is required' });
      }
    } else {
      if (data.percentage12th === undefined || data.percentage12th === null) {
        ctx.addIssue({ code: 'custom', path: ['percentage12th'], message: '12th percentage is required' });
      }
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function responseToForm(p: StudentProfileResponse): ProfileFormValues {
  return {
    fullName: p.fullName,
    phone: p.phone,
    dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? '',
    subjects10th: p.subjects10th?.length
      ? p.subjects10th
      : DEFAULT_SUBJECTS.map((name) => ({ name, marks: 0 })),
    percentage10th: p.percentage10th ?? 0,
    isD2D: p.isD2D ? 'yes' : 'no',
    d2dCgpa: p.d2dCgpa,
    percentage12th: p.percentage12th,
    cpi: p.cpi ?? 0,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { user } = useAuth();

  // Server-fetched profile state
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form-level API error
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // profileLocked comes ONLY from the server response — never from local state
  const isLocked = profile?.profileLocked ?? false;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      subjects10th: DEFAULT_SUBJECTS.map((name) => ({ name, marks: 0 })),
      isD2D: 'no',
    },
  });

  const { fields: subjectFields } = useFieldArray({
    control,
    name: 'subjects10th',
  });

  const isD2D = useWatch({ control, name: 'isD2D' });

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await studentApi.getProfile();
        if (!cancelled) {
          setProfile(data);
          reset(responseToForm(data));
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // No profile yet — form stays empty / defaults
        } else {
          if (!cancelled) setLoadError('Failed to load profile. Please refresh.');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reset]);

  // ── Auto-calculate 10th percentage ───────────────────────────────────────
  const subjects = useWatch({ control, name: 'subjects10th' });
  useEffect(() => {
    if (!subjects?.length) return;
    const total = subjects.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
    const avg = parseFloat((total / subjects.length).toFixed(2));
    setValue('percentage10th', avg, { shouldValidate: false });
  }, [subjects, setValue]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: ProfileFormValues) => {
    setApiError(null);
    setSaveSuccess(false);
    try {
      const saved = await studentApi.saveProfile({
        fullName: values.fullName,
        phone: values.phone,
        dateOfBirth: values.dateOfBirth,
        subjects10th: values.subjects10th,
        percentage10th: values.percentage10th,
        isD2D: values.isD2D === 'yes',
        d2dCgpa: values.isD2D === 'yes' ? values.d2dCgpa : undefined,
        percentage12th: values.isD2D === 'no' ? values.percentage12th : undefined,
        cpi: values.cpi,
      });
      // Reload from server — this is the authoritative source for profileLocked
      setProfile(saved);
      reset(responseToForm(saved));
      setSaveSuccess(true);
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete your profile to appear in recruitment drives.
          </p>
        </div>

        {/* Locked banner — shown only when backend says locked */}
        {isLocked && <ProfileLockedBanner />}

        {/* Success flash */}
        {saveSuccess && !isLocked && (
          <div role="status" className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5">
            <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-700">Profile saved successfully.</p>
          </div>
        )}

        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Personal Details ─────────────────────────────────────────── */}
          <FormSection title="Personal Details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                id="profile-fullname"
                label="Full name"
                type="text"
                placeholder="Ravi Sharma"
                required
                disabled={isLocked}
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                id="profile-email"
                label="Email address"
                type="email"
                value={user?.email ?? ''}
                readOnly
                disabled
                hint="Cannot be changed"
              />
              <Input
                id="profile-phone"
                label="Phone number"
                type="tel"
                placeholder="+91 98765 43210"
                required
                disabled={isLocked}
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                id="profile-dob"
                label="Date of birth"
                type="date"
                required
                disabled={isLocked}
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </div>
          </FormSection>

          {/* ── 10th Marks ───────────────────────────────────────────────── */}
          <FormSection
            title="10th Standard Marks"
            description="Enter marks out of 100 for each subject. Percentage is auto-calculated."
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {subjectFields.map((field, index) => (
                  <Controller
                    key={field.id}
                    control={control}
                    name={`subjects10th.${index}.marks`}
                    render={({ field: f, fieldState }) => (
                      <Input
                        id={`subject-${index}`}
                        label={field.name}
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="0–100"
                        required
                        disabled={isLocked}
                        error={fieldState.error?.message}
                        value={f.value ?? ''}
                        onChange={(e) =>
                          f.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                        }
                      />
                    )}
                  />
                ))}
              </div>

              {/* Auto-calculated percentage */}
              <Controller
                control={control}
                name="percentage10th"
                render={({ field: f }) => (
                  <Input
                    id="percentage-10th"
                    label="10th Percentage (auto-calculated)"
                    type="number"
                    readOnly
                    disabled
                    value={f.value ?? ''}
                    hint="Automatically calculated from subject marks above"
                    error={errors.percentage10th?.message}
                  />
                )}
              />
            </div>
          </FormSection>

          {/* ── Student Type ─────────────────────────────────────────────── */}
          <FormSection
            title="Student Type"
            description="Diploma-to-Degree (D2D) students have a different academic pathway."
          >
            <div className="space-y-5">
              <Controller
                control={control}
                name="isD2D"
                render={({ field: f }) => (
                  <Select
                    id="profile-is-d2d"
                    label="Are you a D2D student?"
                    required
                    disabled={isLocked}
                    options={[
                      { value: 'no', label: 'No — Regular student' },
                      { value: 'yes', label: 'Yes — Diploma to Degree (D2D)' },
                    ]}
                    error={errors.isD2D?.message}
                    value={f.value}
                    onChange={f.onChange}
                  />
                )}
              />

              {/* Conditional: D2D → CGPA, Non-D2D → 12th % */}
              {isD2D === 'yes' ? (
                <Controller
                  control={control}
                  name="d2dCgpa"
                  render={({ field: f, fieldState }) => (
                    <Input
                      id="profile-d2d-cgpa"
                      label="D2D CGPA (out of 10)"
                      type="number"
                      min={0}
                      max={10}
                      step={0.01}
                      placeholder="e.g. 7.85"
                      required
                      disabled={isLocked}
                      error={fieldState.error?.message}
                      value={f.value ?? ''}
                      onChange={(e) =>
                        f.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                      }
                    />
                  )}
                />
              ) : (
                <Controller
                  control={control}
                  name="percentage12th"
                  render={({ field: f, fieldState }) => (
                    <Input
                      id="profile-12th-percentage"
                      label="12th Percentage"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      placeholder="e.g. 82.40"
                      required
                      disabled={isLocked}
                      error={fieldState.error?.message}
                      value={f.value ?? ''}
                      onChange={(e) =>
                        f.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                      }
                    />
                  )}
                />
              )}
            </div>
          </FormSection>

          {/* ── Academic Performance ────────────────────────────────────── */}
          <FormSection title="College Academic Performance">
            <Controller
              control={control}
              name="cpi"
              render={({ field: f, fieldState }) => (
                <Input
                  id="profile-cpi"
                  label="CPI / CGPA (out of 10)"
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  placeholder="e.g. 8.20"
                  required
                  disabled={isLocked}
                  error={fieldState.error?.message}
                  value={f.value ?? ''}
                  onChange={(e) =>
                    f.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                  }
                />
              )}
            />
          </FormSection>

          {/* ── Errors + Submit ─────────────────────────────────────────── */}
          {!isLocked && (
            <div className="space-y-4">
              <FormError message={apiError} />

              <button
                id="profile-submit"
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving profile…
                  </>
                ) : (
                  'Save profile'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
