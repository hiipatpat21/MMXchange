export function LoadingState({ label, variant = "list" }: { label: string; variant?: "list" | "form" }) {
  return (
    <div role="status" aria-live="polite" className="w-full animate-pulse space-y-4">
      <span className="sr-only">{label}</span>
      {variant === "form" ? <div aria-hidden="true" className="surface-card space-y-6 p-6">
        {[1, 2, 3, 4, 5].map((row) => <div key={row} className="space-y-2"><div className="h-3 w-1/3 rounded bg-muted" /><div className="h-11 rounded-xl bg-muted" /></div>)}
      </div> : [1, 2, 3].map((row) => <div key={row} aria-hidden="true" className="surface-card space-y-3 p-5"><div className="h-4 w-2/5 rounded bg-muted" /><div className="h-3 w-4/5 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /></div>)}
    </div>
  );
}
