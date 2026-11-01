import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

type ExchangeRelation = {
  requester_id: string; recipient_id: string;
  requester: { display_name: string } | { display_name: string }[] | null;
  recipient: { display_name: string } | { display_name: string }[] | null;
};

export async function UpcomingExchanges() {
  const { supabase, user } = await getDashboardContext();
  const { data, error } = await supabase.from("exchange_sessions")
    .select("id, exchange_id, starts_at, duration_minutes, skills!skill_id(name), exchange:exchange_requests!exchange_id!inner(requester_id, recipient_id, status, requester:profiles!requester_id(display_name), recipient:profiles!recipient_id(display_name))")
    .eq("status", "scheduled").eq("exchange.status", "scheduled")
    .gt("starts_at", new Date().toISOString()).order("starts_at").order("id").limit(3);
  if (error) return <DashboardError title="Upcoming one-on-one sessions" />;
  return (
    <DashboardSection title="Upcoming one-on-one sessions" href="/exchanges?tab=active" actionLabel="Active exchanges">
      {!data.length ? <DashboardEmpty message="No upcoming exchange sessions. Open an accepted exchange to arrange your first meeting." href="/exchanges?tab=active" label="View active exchanges" /> : <ul className="divide-y">{data.map((session) => {
        const exchange = pickOne<ExchangeRelation>(session.exchange);
        const other = exchange ? pickOne(exchange.requester_id === user.id ? exchange.recipient : exchange.requester)?.display_name : null;
        const skill = pickOne<{ name: string }>(session.skills)?.name;
        return <li key={session.id} className="py-3">
          <Link href={`/exchanges/${session.exchange_id}`} className="block min-h-10 space-y-1 rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-primary hover:bg-muted">
            <p className="break-words font-medium">{skill ?? "Skill exchange"} with {other ?? "your partner"}</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(session.starts_at)} · {session.duration_minutes} minutes</p>
            <span className="text-sm text-primary underline">View exchange</span>
          </Link>
        </li>;
      })}</ul>}
    </DashboardSection>
  );
}
