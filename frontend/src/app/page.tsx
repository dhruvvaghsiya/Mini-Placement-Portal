import Link from 'next/link';
import { APP_NAME, ROUTES } from '@/lib/constants';

const studentLinks = [
  { label: 'Login', href: ROUTES.LOGIN },
  { label: 'Register', href: ROUTES.REGISTER },
  { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
  { label: 'Profile', href: ROUTES.STUDENT.PROFILE },
  { label: 'Drives', href: ROUTES.STUDENT.DRIVES },
  { label: 'Applications', href: ROUTES.STUDENT.APPLICATIONS },
];

const tpoLinks = [
  { label: 'Dashboard', href: ROUTES.TPO.DASHBOARD },
  { label: 'Students', href: ROUTES.TPO.STUDENTS },
  { label: 'Companies', href: ROUTES.TPO.COMPANIES },
  { label: 'Drives', href: ROUTES.TPO.DRIVES },
  { label: 'Applications', href: ROUTES.TPO.APPLICATIONS },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gray-50 p-8">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Frontend is running
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
          {APP_NAME}
        </h1>
        <p className="mt-3 max-w-md text-gray-500">
          A full-stack placement management system for students and Training &amp;
          Placement Officers.
        </p>
      </div>

      {/* Route map */}
      <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        {/* Student */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Student
          </h2>
          <ul className="space-y-2">
            {studentLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  <span>{label}</span>
                  <span className="font-mono text-xs text-gray-400">{href}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* TPO */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-purple-600">
            TPO
          </h2>
          <ul className="space-y-2">
            {tpoLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                >
                  <span>{label}</span>
                  <span className="font-mono text-xs text-gray-400">{href}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Next.js · TypeScript · Tailwind CSS · App Router
      </p>
    </main>
  );
}
