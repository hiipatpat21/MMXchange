import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exchangeSelect, exchangePerspective, type ExchangeRow } from "@/lib/exchanges";
import { canMessage, type MessageRow } from "@/lib/messages";
import { formatDateTime } from "@/lib/datetime";
import { LoadingState } from "@/components/ui/loading-state";
import { MessageForm } from "@/components/messages/message-form";
import { RefreshButton } from "@/components/messages/refresh-button";
import { MarkThreadRead } from "@/components/messages/mark-thread-read";

async function Thread({ params, searchParams }: { params: Promise<{ exchangeId: string }>; searchParams: Promise<{ before?: string; beforeId?: string }> }) {
  const { exchangeId: id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const cursor = z.object({ before: z.iso.datetime({ offset: true }), beforeId: z.string().uuid() }).safeParse(query);
  if ((query.before || query.beforeId) && !cursor.success) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("exchange_requests").select(exchangeSelect).eq("id", id).maybeSingle();
  if (error) return <p role="alert" className="text-destructive">Could not load this conversation. Please refresh.</p>;
  if (!data) notFound();
  const exchange = data as ExchangeRow;
  if (exchange.requester_id !== user.id && exchange.recipient_id !== user.id) notFound();
  const other = exchangePerspective(exchange, user.id);
  let request = supabase.from("exchange_messages").select("id, sender_id, body, created_at").eq("exchange_id", id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
  if (cursor.success) request = request.or(`created_at.lt.${cursor.data.before},and(created_at.eq.${cursor.data.before},id.lt.${cursor.data.beforeId})`);
  const { data: messages, error: messagesError } = await request;
  const newest = (messages ?? []).slice(0, 50) as MessageRow[];
  const oldest = newest.at(-1);
  return <article className="mx-auto max-w-2xl space-y-6">
    <header className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="break-words page-heading">Messages with {other.otherName}</h1><RefreshButton /></div><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/exchanges/${id}`}>View exchange</Link><p className="text-sm text-muted-foreground">Refresh to check for new messages. Times are Philippine time.</p></header>
    {messagesError ? <p role="alert" className="text-destructive">Could not load messages. Please refresh.</p> : <>
      {!cursor.success && newest[0] && <MarkThreadRead id={id} through={newest[0].created_at} />}
      {(messages?.length ?? 0) > 50 && oldest && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/messages/${id}?${new URLSearchParams({ before: oldest.created_at, beforeId: oldest.id })}`}>Older messages</Link>}
      {cursor.success && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/messages/${id}`}>Latest messages</Link>}
      {newest.length ? <ol aria-label="Messages" className="space-y-4">{newest.toReversed().map(message => <li key={message.id} className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] min-w-0 rounded-2xl border p-4 ${message.sender_id === user.id ? "bg-primary/10" : "bg-card"}`}><p className="mb-1 text-xs font-semibold">{message.sender_id === user.id ? "You" : other.otherName}</p><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(message.created_at)}</p></div></li>)}</ol> : <p className="surface-card p-5 text-muted-foreground">No messages yet. Send a message to plan your exchange.</p>}
    </>}
    {canMessage(exchange.status) ? <section className="surface-card p-5"><MessageForm id={id} /></section> : <p className="surface-card p-5 text-muted-foreground">Messaging is closed because this exchange was {exchange.status}. Previous messages remain visible to both participants.</p>}
    <Link href="/messages" className="inline-flex min-h-11 items-center text-primary underline">All conversations</Link>
  </article>;
}

export default function ThreadPage(props: { params: Promise<{ exchangeId: string }>; searchParams: Promise<{ before?: string; beforeId?: string }> }) {
  return <Suspense fallback={<LoadingState label="Loading conversation…" />}><Thread {...props} /></Suspense>;
}
