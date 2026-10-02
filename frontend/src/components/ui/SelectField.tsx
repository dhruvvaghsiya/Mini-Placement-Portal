'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    error?: string;
    options: { value: string; label: string }[];
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
    ({ label, id, error, options, disabled, className = '', ...props }, ref) => (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium text-slate-700">
                {label}
            </label>
            <select
                ref={ref}
                id={id}
                disabled={disabled}
                className={[
                    'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition',
                    disabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500'
                        : 'border-slate-300 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
                    error ? 'border-red-400' : '',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                {...props}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    ),
);
SelectField.displayName = 'SelectField';

export default SelectField;
