interface SectionCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    locked?: boolean;
}

export default function SectionCard({ title, subtitle, children, locked }: SectionCardProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
                </div>
                {locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                        🔒 Locked
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2">{children}</div>
        </div>
    );
}
