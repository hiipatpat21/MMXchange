import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { loadSessionCards } from "@/lib/group-sessions";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function LearningAgenda() {
  const { supabase, user } = await getDashboardContext();
    const [exchangeResult, joinedResult, hostedResult] = await Promise.allSettled([
      supabase.from("exchange_sessions").select("id, exchange_id, starts_at, skills!skill_id(name), exchange:exchange_requests!exchange_id!inner(status)").eq("status", "scheduled").eq("exchange.status", "scheduled").gt("starts_at", new Date().toISOString()).order("starts_at").order("id").limit(3),
      loadSessionCards(supabase, { registeredId: user.id, upcomingOnly: true, limit: 3 }),
      loadSessionCards(supabase, { organizerId: user.id, upcomingOnly: true, limit: 3 }),
    ]);
    if (exchangeResult.status === "rejected" || joinedResult.status === "rejected" || hostedResult.status === "rejected") return <DashboardError title="Coming up" />;
    const exchanges = exchangeResult.value;
    const joined = joinedResult.value;
    const hosted = hostedResult.value;
    if (exchanges.error) return <DashboardError title="Coming up" />;
    const items = [
      ...(exchanges.data ?? []).map(row => ({ id: row.id, title: pickOne<{ name: string }>(row.skills)?.name ?? "Skill exchange", at: row.starts_at, kind: "One-on-one", href: `/exchanges/${row.exchange_id}` })),
      ...joined.sessions.map(row => ({ id: row.id, title: row.title, at: row.starts_at, kind: "You're joining", href: `/sessions/${row.id}` })),
      ...hosted.sessions.map(row => ({ id: row.id, title: row.title, at: row.starts_at, kind: "You're hosting", href: `/sessions/${row.id}` })),
    ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id)).slice(0, 3);
    return <DashboardSection title="Coming up" href="/sessions/registered" actionLabel="My sessions">
      {items.length ? <ul>{items.map(item => <li key={`${item.kind}:${item.id}`}><Link href={item.href} className="dashboard-row"><span className="min-w-0"><span className="block break-words text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDateTime(item.at)}</span></span><span className="shrink-0 text-xs text-muted-foreground">{item.kind}</span></Link></li>)}</ul> : <DashboardEmpty message="Your next learning moment is still out there." href="/sessions" label="Explore sessions" />}
      <div className="flex flex-wrap gap-x-5 text-xs"><Link href="/exchanges?tab=active" className="inline-flex min-h-11 items-center text-primary hover:underline">My exchanges →</Link><Link href="/sessions/organized" className="inline-flex min-h-11 items-center text-primary hover:underline">Sessions I host →</Link></div>
    </DashboardSection>;
}
