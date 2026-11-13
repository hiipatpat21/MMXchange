import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";
export async function LearningAgenda() {
  const { supabase } = await getDashboardContext();
  const now = new Date().toISOString();
  const [exchanges, paid] = await Promise.all([
    supabase.from("exchange_sessions").select("id, exchange_id, starts_at, skills!skill_id(name), exchange:exchange_requests!exchange_id!inner(status)").eq("status", "scheduled").eq("exchange.status", "scheduled").gt("starts_at", now).order("starts_at").order("id").limit(3),
    supabase.from("paid_lesson_bookings").select("request_id, starts_at, request:paid_lesson_requests!request_id!inner(skill_name, status)").eq("status", "confirmed").eq("request.status", "accepted").gt("starts_at", now).order("starts_at").order("request_id").limit(3),
  ]);
  if (exchanges.error || paid.error) return <DashboardError title="Coming up" />;
  const items = [
    ...(exchanges.data ?? []).map(row => ({ id: row.id, title: pickOne<{ name: string }>(row.skills)?.name ?? "Skill exchange", at: row.starts_at, kind: "Free swap", href: `/exchanges/${row.exchange_id}` })),
    ...(paid.data ?? []).map(row => ({ id: row.request_id, title: pickOne<{ skill_name: string }>(row.request)?.skill_name ?? "Individual lesson", at: row.starts_at, kind: "Paid lesson", href: `/lessons/${row.request_id}` })),
  ].sort((a,b) => Date.parse(a.at)-Date.parse(b.at) || a.id.localeCompare(b.id)).slice(0,3);
  return <DashboardSection title="Coming up" href="/exchanges?tab=active" actionLabel="My learning">
    {items.length ? <ul>{items.map(item => <li key={`${item.kind}:${item.id}`}><Link href={item.href} className="dashboard-row"><span className="min-w-0"><span className="block break-words text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDateTime(item.at)}</span></span><span className="shrink-0 text-xs text-muted-foreground">{item.kind}</span></Link></li>)}</ul> : <DashboardEmpty message="No confirmed meetings coming up. Open My learning to check your requests and reservations." href="/exchanges" label="Open My learning" />}
  </DashboardSection>;
}
