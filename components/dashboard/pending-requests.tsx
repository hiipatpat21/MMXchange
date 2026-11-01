import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { exchangeSelect, exchangePerspective, type ExchangeRow } from "@/lib/exchanges";
import { formatDateTime } from "@/lib/datetime";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function PendingRequests() {
  const { supabase, user } = await getDashboardContext();
  const [incoming, outgoing] = await Promise.all([
    supabase.from("exchange_requests").select(exchangeSelect).eq("recipient_id", user.id).eq("status", "pending").order("created_at", { ascending: false }).order("id").limit(3),
    supabase.from("exchange_requests").select(exchangeSelect).eq("requester_id", user.id).eq("status", "pending").order("created_at", { ascending: false }).order("id").limit(3),
  ]);
  if (incoming.error || outgoing.error) return <DashboardError title="Pending requests" />;
  const groups = [
    { title: "Incoming", rows: incoming.data as ExchangeRow[], action: "Review" },
    { title: "Outgoing", rows: outgoing.data as ExchangeRow[], action: "View request" },
  ];
  return (
    <DashboardSection title="Pending requests" href="/exchanges" actionLabel="All exchanges">
      {!groups.some((group) => group.rows.length) ? <DashboardEmpty message="No pending requests. Find a student and propose a skill exchange." href="/discover" label="Find a partner" /> : groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-sm font-semibold">{group.title}</h3>
          {!group.rows.length ? <p className="text-sm text-muted-foreground">No {group.title.toLowerCase()} requests.</p> : <ul className="divide-y">{group.rows.map((exchange) => {
            const view = exchangePerspective(exchange, user.id);
            return <li key={exchange.id} className="space-y-1 py-3">
              <p className="break-words font-medium">{view.otherName}</p>
              <p className="break-words text-sm text-muted-foreground">You teach {view.youTeach}; they teach {view.theyTeach}.</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(exchange.created_at)}</p>
              <Link href={`/exchanges/${exchange.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">{group.action}<span className="sr-only"> with {view.otherName}</span></Link>
            </li>;
          })}</ul>}
        </div>
      ))}
    </DashboardSection>
  );
}
