import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardSection({ title, href, actionLabel, children }: {
  title: string; href?: string; actionLabel?: string; children: React.ReactNode;
}) {
  const id = `dashboard-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        {href && actionLabel && <Button asChild variant="outline" className="min-h-10"><Link href={href}>{actionLabel}</Link></Button>}
      </div>
      {children}
    </section>
  );
}

export function DashboardEmpty({ message, href, label }: { message: string; href: string; label: string }) {
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">{message}</p><Button asChild className="min-h-10"><Link href={href}>{label}</Link></Button></div>;
}

export function DashboardError({ title }: { title: string }) {
  return <DashboardSection title={title}><p role="alert" className="text-sm text-destructive">Could not load this section. Reload the page to try again.</p></DashboardSection>;
}

export function DashboardSkeleton({ title }: { title: string }) {
  return (
    <DashboardSection title={title}>
      <div role="status" aria-label={`Loading ${title}`} className="animate-pulse space-y-3">
        {[1, 2, 3].map((row) => <div key={row} aria-hidden="true" className="space-y-2 rounded-lg border p-3"><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /></div>)}
        <span className="sr-only">Loading {title}...</span>
      </div>
    </DashboardSection>
  );
}
