/**
 * Displayed when profileLocked === true (value comes from the backend, never frontend state).
 * Makes it unambiguous to the student that the profile can no longer be edited.
 */
export default function ProfileLockedBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="h-4 w-4 text-amber-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800">Profile Locked</p>
        <p className="mt-0.5 text-xs text-amber-700">
          Your academic profile has been submitted and verified. It can no longer
          be edited. Contact your TPO if you need to make a correction.
        </p>
      </div>
    </div>
  );
}
