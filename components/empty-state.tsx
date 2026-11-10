// Shared empty state: a small line illustration above a short text.
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center text-muted">
      <svg
        viewBox="0 0 96 72"
        className="w-28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="26" y="10" width="44" height="52" rx="8" className="fill-surface" />
        <path d="M36 26h24M36 36h24M36 46h14" />
        <circle cx="72" cy="14" r="8" className="fill-primary stroke-none" />
        <path d="M8 62h80" />
      </svg>
      <p>{children}</p>
    </div>
  );
}
