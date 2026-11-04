import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardSection({ title, href, actionLabel, children }: {
  title: string; href?: string; actionLabel?: string; children: React.ReactNode;
}) {
  const id = `dashboard-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="dashboard-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-base font-semibold">{title}</h2>
        {href && actionLabel && <Link href={href} className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">{actionLabel}<span aria-hidden="true" className="ml-2">→</span></Link>}
      </div>
      {children}
    </section>
  );
}

export function DashboardEmpty({ message, href, label }: { message: string; href: string; label: string }) {
  return <div className="space-y-2"><p className="text-sm text-muted-foreground">{message}</p><Button asChild variant="outline"><Link href={href}>{label}</Link></Button></div>;
}

export function DashboardError({ title }: { title: string }) {
  return <DashboardSection title={title}><p role="alert" className="text-sm text-destructive">Could not load this section. Reload the page to try again.</p></DashboardSection>;
}

export function DashboardSkeleton({ title }: { title: string }) {
  return (
    <DashboardSection title={title}>
      <div role="status" aria-label={`Loading ${title}`} className="animate-pulse space-y-3">
        {[1, 2].map((row) => <div key={row} aria-hidden="true" className="space-y-2 py-3"><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /></div>)}
        <span className="sr-only">Loading {title}...</span>
      </div>
    </DashboardSection>
  );
}
