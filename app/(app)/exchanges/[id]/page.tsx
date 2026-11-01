import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exchangeFormats, exchangePerspective, type ExchangeRow } from "@/lib/exchanges";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { StatusBadge } from "@/components/exchanges/status-badge";
import { ExchangeResponse } from "@/components/exchanges/exchange-response";

async function ExchangeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data, error } = await supabase.from("exchange_requests")
    .select("id, requester_id, recipient_id, status, created_at, message, format, availability, notes, requester:profiles!requester_id(display_name), recipient:profiles!recipient_id(display_name), learn_skill:skills!learn_skill_id(name), teach_skill:skills!teach_skill_id(name)")
    .eq("id", id).maybeSingle();
  if (error) return <p role="alert" className="text-destructive">Could not load this exchange. Please reload to try again.</p>;
  if (!data) notFound();
  const exchange = data as ExchangeRow & { message: string; format: keyof typeof exchangeFormats; availability: string | null; notes: string | null };
  // RLS already hides the row from non-participants; keep this explicit too.
  if (user.id !== exchange.requester_id && user.id !== exchange.recipient_id) notFound();
  const view = exchangePerspective(exchange, user.id);
  const isRequester = exchange.requester_id === user.id;
  const canRespond = !isRequester && exchange.status === "pending";
  const canCancel = (isRequester && exchange.status === "pending") || exchange.status === "accepted";
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <StatusBadge status={exchange.status} />
        <h1 className="break-words text-2xl font-semibold">Exchange with {view.otherName}</h1>
        <p className="text-sm text-muted-foreground">Requested {formatDateTime(exchange.created_at)}</p>
      </header>
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Exchange summary</h2>
        <p className="break-words text-sm">Requested by <Link className="text-primary underline" href={`/students/${exchange.requester_id}`}>{pickOne(exchange.requester)?.display_name ?? "Student"}</Link> for <Link className="text-primary underline" href={`/students/${exchange.recipient_id}`}>{pickOne(exchange.recipient)?.display_name ?? "Student"}</Link>.</p>
        <dl className="space-y-3 break-words">
          <div><dt className="text-sm text-muted-foreground">You teach</dt><dd className="font-medium">{view.youTeach}</dd></div>
          <div><dt className="text-sm text-muted-foreground">They teach</dt><dd className="font-medium">{view.theyTeach}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Preferred format</dt><dd>{exchangeFormats[exchange.format]}</dd></div>
        </dl>
      </section>
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Request details</h2>
        <dl className="space-y-4 break-words">
          <div><dt className="font-medium">Message</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.message}</dd></div>
          <div><dt className="font-medium">Availability</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.availability || "Not provided."}</dd></div>
          <div><dt className="font-medium">Learning goals</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.notes || "Not provided."}</dd></div>
        </dl>
      </section>
      {exchange.status === "accepted" && <div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Next: schedule your session</h2><p className="mt-1 text-sm text-muted-foreground">Scheduling will be available in the next phase.</p></div>}
      {exchange.status === "pending" && isRequester && <p className="text-sm text-muted-foreground">Waiting for {view.otherName} to respond.</p>}
      {(canRespond || canCancel) && <ExchangeResponse exchangeId={id} canRespond={canRespond} />}
      <Link href="/exchanges" className="inline-flex min-h-10 items-center text-sm text-primary underline">Back to exchanges</Link>
    </article>
  );
}

export default function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p role="status">Loading exchange...</p>}><ExchangeDetail params={params} /></Suspense>;
}
