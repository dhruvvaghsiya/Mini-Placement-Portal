'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    error?: string;
    hint?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, id, error, hint, disabled, readOnly, className = '', ...props }, ref) => {
        const locked = disabled || readOnly;
        return (
            <div className="flex flex-col gap-1">
                <label htmlFor={id} className="text-sm font-medium text-slate-700">
                    {label}
                </label>
                <input
                    ref={ref}
                    id={id}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={[
                        'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition',
                        'placeholder:text-slate-400',
                        locked
                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500'
                            : 'border-slate-300 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
                        error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '',
                        className,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    {...props}
                />
                {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    },
);
InputField.displayName = 'InputField';

export default InputField;
