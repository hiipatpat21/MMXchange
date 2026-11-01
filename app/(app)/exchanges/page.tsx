import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exchangeSelect, type ExchangeRow } from "@/lib/exchanges";
import { ExchangeCard } from "@/components/exchanges/exchange-card";
import { Button } from "@/components/ui/button";

const tabs = ["incoming", "outgoing", "active", "past"] as const;
const labels = { incoming: "Incoming", outgoing: "Outgoing", active: "Active", past: "Past" };
const emptyMessages = {
  incoming: "No incoming requests. You can find learning partners on Discover.",
  outgoing: "No pending requests sent. Find a student and propose an exchange.",
  active: "No active exchanges yet. Accepted requests will appear here.",
  past: "No past exchanges yet. Completed, declined, and cancelled exchanges will appear here.",
};
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ExchangeList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tabResult = z.enum(tabs).safeParse(params.tab);
  const tab = tabResult.success ? tabResult.data : "incoming";
  const pageResult = z.coerce.number().int().min(1).max(10000).safeParse(params.page ?? 1);
  const page = pageResult.success ? pageResult.data : 1;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  let query = supabase.from("exchange_requests").select(exchangeSelect);
  if (tab === "incoming") query = query.eq("recipient_id", user.id).eq("status", "pending");
  if (tab === "outgoing") query = query.eq("requester_id", user.id).eq("status", "pending");
  if (tab === "active") query = query.in("status", ["accepted", "scheduled"]);
  if (tab === "past") query = query.in("status", ["declined", "cancelled", "completed"]);
  // RLS restricts every query, including counts, to this student's exchanges.
  const [list, incoming, outgoing, active, past] = await Promise.all([
    query.order("created_at", { ascending: false }).order("id").range((page - 1) * 30, page * 30 - 1),
    supabase.from("exchange_requests").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("status", "pending"),
    supabase.from("exchange_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "pending"),
    supabase.from("exchange_requests").select("id", { count: "exact", head: true }).in("status", ["accepted", "scheduled"]),
    supabase.from("exchange_requests").select("id", { count: "exact", head: true }).in("status", ["declined", "cancelled", "completed"]),
  ]);
  if ([list, incoming, outgoing, active, past].some((result) => result.error)) return <p role="alert" className="text-destructive">Could not load exchanges. Please reload to try again. If this is a new setup, run the phase 2 SQL first.</p>;
  const counts = { incoming: incoming.count ?? 0, outgoing: outgoing.count ?? 0, active: active.count ?? 0, past: past.count ?? 0 };
  const exchanges = (list.data ?? []) as ExchangeRow[];
  return (
    <div className="space-y-5">
      <nav aria-label="Exchange filters" className="flex flex-wrap gap-2">
        {tabs.map((key) => <Button key={key} asChild variant={tab === key ? "default" : "outline"} className="min-h-11"><Link href={`/exchanges?tab=${key}`} aria-current={tab === key ? "page" : undefined}>{labels[key]} ({counts[key]})</Link></Button>)}
      </nav>
      {exchanges.length ? (
        <div className="grid gap-4 lg:grid-cols-2">{exchanges.map((exchange) => <ExchangeCard key={exchange.id} exchange={exchange} userId={user.id} />)}</div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed p-6">
          <p>{page > 1 ? "No exchanges on this page." : emptyMessages[tab]}</p>
          <Button asChild variant="outline" className="min-h-11"><Link href={page > 1 ? `/exchanges?tab=${tab}` : "/discover"}>{page > 1 ? "Back to first page" : "Discover students"}</Link></Button>
        </div>
      )}
      <nav aria-label="Exchange pages" className="flex flex-wrap gap-3">
        {page > 1 && <Button asChild variant="outline" className="min-h-11"><Link href={`/exchanges?tab=${tab}&page=${page - 1}`}>Previous</Link></Button>}
        {counts[tab] > page * 30 && <Button asChild variant="outline" className="min-h-11"><Link href={`/exchanges?tab=${tab}&page=${page + 1}`}>Next</Link></Button>}
      </nav>
    </div>
  );
}

export default function ExchangesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <header><h1 className="page-heading">Your exchanges</h1><p className="mt-1 text-muted-foreground">Review requests and follow your one-on-one learning exchanges.</p></header>
      <Suspense fallback={<LoadingState label="Loading exchanges..." />}><ExchangeList searchParams={searchParams} /></Suspense>
    </div>
  );
}
