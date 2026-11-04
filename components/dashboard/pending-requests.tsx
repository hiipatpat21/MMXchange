import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { exchangeSelect, exchangePerspective, type ExchangeRow } from "@/lib/exchanges";
import { DashboardSection, DashboardError } from "@/components/dashboard/dashboard-section";

export async function PendingRequests() {
  const { supabase, user } = await getDashboardContext();
  const [incoming, outgoing] = await Promise.all([
    supabase.from("exchange_requests").select(exchangeSelect, { count: "exact" }).eq("recipient_id", user.id).eq("status", "pending").order("created_at", { ascending: false }).order("id").limit(2),
    supabase.from("exchange_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "pending"),
  ]);
  if (incoming.error || outgoing.error) return <DashboardError title="Requests" />;
  return (
    <DashboardSection title="Requests" href="/exchanges" actionLabel="View all">
      {incoming.data?.length ? <ul>{(incoming.data as ExchangeRow[]).map((exchange) => {
            const view = exchangePerspective(exchange, user.id);
            return <li key={exchange.id}><Link href={`/exchanges/${exchange.id}`} className="dashboard-row"><span className="min-w-0 break-words text-sm font-medium">{view.otherName}<span className="mt-1 block text-xs font-normal text-muted-foreground">Wants to swap skills</span></span><span className="shrink-0 text-sm text-primary">Review →</span></Link></li>;
          })}</ul> : <p className="text-sm text-muted-foreground">No requests to review. You&apos;re all caught up.</p>}
      <div className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground"><span>{incoming.count ?? 0} incoming</span><Link href="/exchanges?tab=outgoing" className="inline-flex min-h-11 items-center underline">{outgoing.count ?? 0} waiting for a reply</Link></div>
    </DashboardSection>
  );
}
