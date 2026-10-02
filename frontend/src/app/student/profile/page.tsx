'use client';

import { useEffect, useState, useCallback } from 'react';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import SectionCard from '@/components/ui/SectionCard';
import { fetchProfile, createProfile } from '@/lib/api';
import type { StudentProfile, CreateProfilePayload, TenthSubjectMarks } from '@/types/student';

interface FormState {
    fullName: string;
    phone: string;
    dob: string;
    tenthMaths: string;
    tenthPhysics: string;
    tenthChemistry: string;
    tenthEnglish: string;
    tenthComputer: string;
    tenthPercentage: string;
    isD2D: 'yes' | 'no';
    twelfthPercentage: string;
    d2dCgpa: string;
    cpi: string;
}

const INITIAL_FORM: FormState = {
    fullName: '', phone: '', dob: '',
    tenthMaths: '', tenthPhysics: '', tenthChemistry: '', tenthEnglish: '', tenthComputer: '',
    tenthPercentage: '', isD2D: 'no', twelfthPercentage: '', d2dCgpa: '', cpi: '',
};

function profileToForm(p: StudentProfile): FormState {
    const sm = p.tenthSubjectMarks;
    return {
        fullName: p.fullName, phone: p.phone, dob: p.dob.split('T')[0],
        tenthMaths: sm?.tenthMaths?.toString() ?? '',
        tenthPhysics: sm?.tenthPhysics?.toString() ?? '',
        tenthChemistry: sm?.tenthChemistry?.toString() ?? '',
        tenthEnglish: sm?.tenthEnglish?.toString() ?? '',
        tenthComputer: sm?.tenthComputer?.toString() ?? '',
        tenthPercentage: p.tenthPercentage.toString(),
        isD2D: p.isD2D ? 'yes' : 'no',
        twelfthPercentage: p.twelfthPercentage?.toString() ?? '',
        d2dCgpa: p.d2dCgpa?.toString() ?? '',
        cpi: p.cpi.toString(),
    };
}

function isNum(v: unknown): v is number {
    return typeof v === 'number' && isFinite(v) && v >= 0;
}

export default function StudentProfilePage() {
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitErrors, setSubmitErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setApiError(null);
        try {
            const res = await fetchProfile();
            if (res.success && res.data?.profile) {
                setProfile(res.data.profile);
                setForm(profileToForm(res.data.profile));
            }
        } catch {
            setApiError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const locked = profile?.profileLocked === true;

    function handleChange(field: keyof FormState, value: string) {
        if (locked) return;
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setApiError(null);
        setSubmitErrors([]);
        setSuccessMsg(null);
    }

    function validate(): boolean {
        const errs: Partial<Record<keyof FormState, string>> = {};
        if (!form.fullName.trim()) errs.fullName = 'Full name is required';
        if (!/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Must be a 10-digit number';
        if (!form.dob) errs.dob = 'Date of birth is required';

        const numChecks: [keyof FormState, string, number, number][] = [
            ['tenthMaths', '10th Maths', 0, 100], ['tenthPhysics', '10th Physics', 0, 100],
            ['tenthChemistry', '10th Chemistry', 0, 100], ['tenthEnglish', '10th English', 0, 100],
            ['tenthComputer', '10th Computer', 0, 100],
            ['tenthPercentage', '10th Percentage', 0, 100], ['cpi', 'CPI', 0, 10],
        ];
        for (const [key, label, min, max] of numChecks) {
            const v = Number(form[key]);
            if (form[key] === '' || isNaN(v) || v < min || v > max)
                errs[key] = `${label} must be ${min}–${max}`;
        }
        if (form.isD2D === 'no') {
            const v = Number(form.twelfthPercentage);
            if (form.twelfthPercentage === '' || isNaN(v) || v < 0 || v > 100)
                errs.twelfthPercentage = '12th percentage must be 0–100';
        }
        if (form.isD2D === 'yes') {
            const v = Number(form.d2dCgpa);
            if (form.d2dCgpa === '' || isNaN(v) || v < 0 || v > 10)
                errs.d2dCgpa = 'D2D CGPA must be 0–10';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (locked || submitting || !validate()) return;
        setSubmitting(true);
        setApiError(null);
        setSubmitErrors([]);

        const marks: TenthSubjectMarks = {
            tenthMaths: Number(form.tenthMaths), tenthPhysics: Number(form.tenthPhysics),
            tenthChemistry: Number(form.tenthChemistry), tenthEnglish: Number(form.tenthEnglish),
            tenthComputer: Number(form.tenthComputer),
        };
        const payload: CreateProfilePayload = {
            fullName: form.fullName.trim(), phone: form.phone.trim(), dob: form.dob,
            tenthSubjectMarks: marks, tenthPercentage: Number(form.tenthPercentage),
            isD2D: form.isD2D === 'yes', cpi: Number(form.cpi),
            ...(form.isD2D === 'no' && { twelfthPercentage: Number(form.twelfthPercentage) }),
            ...(form.isD2D === 'yes' && { d2dCgpa: Number(form.d2dCgpa) }),
        };

        try {
            const res = await createProfile(payload);
            if (res.success && res.data?.profile) {
                setProfile(res.data.profile);
                setForm(profileToForm(res.data.profile));
                setSuccessMsg('Profile submitted and locked successfully!');
            } else {
                if (res.errors?.length) setSubmitErrors(res.errors);
                else setApiError(res.message || 'Submission failed. Please try again.');
            }
        } catch {
            setApiError('Unable to connect to the server.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                    <p className="text-sm text-slate-500">Loading your profile…</p>
                </div>
            </div>
        );
    }

    if (apiError && !profile && !loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow">
                    <p className="text-2xl">⚠️</p>
                    <p className="mt-2 font-semibold text-red-700">Connection Error</p>
                    <p className="mt-1 text-sm text-red-600">{apiError}</p>
                    <button onClick={loadProfile}
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Student Profile</h1>
                            <p className="mt-0.5 text-sm text-slate-500">Mini Placement Portal</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="/student/drives"
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition">
                                View Drives →
                            </a>
                            {locked && (
                                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 ring-1 ring-amber-300">
                                    <span>🔒</span>
                                    <span className="text-sm font-semibold text-amber-700">Profile Locked</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                {locked && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                        <p className="text-sm font-medium text-amber-800">
                            🔒 Your profile has been submitted and locked. No further changes are allowed.
                        </p>
                        {profile?.isVerified && (
                            <p className="mt-1 text-sm font-medium text-green-700">✅ Verified by TPO</p>
                        )}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                        <p className="text-sm font-semibold text-green-800">✅ {successMsg}</p>
                    </div>
                )}
                {apiError && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                        <p className="text-sm text-red-700">{apiError}</p>
                    </div>
                )}
                {submitErrors.length > 0 && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                        <p className="mb-2 text-sm font-semibold text-red-800">Please fix the following:</p>
                        <ul className="list-inside list-disc space-y-1">
                            {submitErrors.map((e, i) => <li key={i} className="text-sm text-red-700">{e}</li>)}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                    <SectionCard title="Personal Details" subtitle="Your basic identity information" locked={locked}>
                        <div className="sm:col-span-2">
                            <InputField id="fullName" label="Full Name" placeholder="e.g. Dhruv Vaghsiya"
                                value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)}
                                disabled={locked} error={errors.fullName} />
                        </div>
                        <InputField id="phone" label="Phone Number" type="tel" placeholder="10-digit number"
                            value={form.phone} maxLength={10} onChange={(e) => handleChange('phone', e.target.value)}
                            disabled={locked} error={errors.phone} />
                        <InputField id="dob" label="Date of Birth" type="date" value={form.dob}
                            onChange={(e) => handleChange('dob', e.target.value)}
                            disabled={locked} error={errors.dob} />
                    </SectionCard>

                    <SectionCard title="10th Standard" subtitle="Subject marks and overall percentage" locked={locked}>
                        {([
                            ['tenthMaths', 'Maths Marks'], ['tenthPhysics', 'Physics Marks'],
                            ['tenthChemistry', 'Chemistry Marks'], ['tenthEnglish', 'English Marks'],
                            ['tenthComputer', 'Computer Marks'],
                        ] as [keyof FormState, string][]).map(([key, label]) => (
                            <InputField key={key} id={key} label={label} type="number" min={0} max={100}
                                placeholder="0 – 100" value={form[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                disabled={locked} error={errors[key]} />
                        ))}
                        <InputField id="tenthPercentage" label="10th Percentage (%)" type="number"
                            min={0} max={100} step={0.01} placeholder="e.g. 87.50"
                            value={form.tenthPercentage}
                            onChange={(e) => handleChange('tenthPercentage', e.target.value)}
                            disabled={locked} error={errors.tenthPercentage} />
                    </SectionCard>

                    <SectionCard title="Student Type & Higher Education" subtitle="D2D = Diploma to Degree lateral entry" locked={locked}>
                        <SelectField id="isD2D" label="Are you a D2D student?" value={form.isD2D}
                            onChange={(e) => handleChange('isD2D', e.target.value as 'yes' | 'no')}
                            disabled={locked}
                            options={[
                                { value: 'no', label: 'No — Regular student' },
                                { value: 'yes', label: 'Yes — D2D (Lateral Entry)' },
                            ]} />
                        {form.isD2D === 'no' && (
                            <InputField id="twelfthPercentage" label="12th Percentage (%)" type="number"
                                min={0} max={100} step={0.01} placeholder="e.g. 82.40"
                                value={form.twelfthPercentage}
                                onChange={(e) => handleChange('twelfthPercentage', e.target.value)}
                                disabled={locked} error={errors.twelfthPercentage} />
                        )}
                        {form.isD2D === 'yes' && (
                            <InputField id="d2dCgpa" label="Diploma CGPA" type="number"
                                min={0} max={10} step={0.01} placeholder="e.g. 8.50"
                                value={form.d2dCgpa}
                                onChange={(e) => handleChange('d2dCgpa', e.target.value)}
                                disabled={locked} error={errors.d2dCgpa} hint="Scale: 0 – 10" />
                        )}
                    </SectionCard>

                    <SectionCard title="Current Academic Performance" subtitle="Your CPI at time of registration" locked={locked}>
                        <InputField id="cpi" label="Current CPI" type="number" min={0} max={10} step={0.01}
                            placeholder="e.g. 8.25" value={form.cpi}
                            onChange={(e) => handleChange('cpi', e.target.value)}
                            disabled={locked} error={errors.cpi} hint="Scale: 0 – 10" />
                    </SectionCard>

                    {!locked && (
                        <div className="flex flex-col items-end gap-2">
                            <p className="max-w-xs text-right text-xs text-slate-400">
                                ⚠️ Once submitted, your profile will be permanently locked. Review carefully.
                            </p>
                            <button id="submit-profile-btn" type="submit" disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                                {submitting ? (
                                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Submitting…</>
                                ) : 'Submit & Lock Profile'}
                            </button>
                        </div>
                    )}
                </form>
            </main>
        </div>
    );
}
