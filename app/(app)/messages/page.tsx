import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/datetime";
import type { Conversation } from "@/lib/messages";
import { LoadingState } from "@/components/ui/loading-state";
import { RefreshButton } from "@/components/messages/refresh-button";
import { PageIntro } from "@/components/layout/page-intro";

async function Conversations({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const page = Math.min(10000, Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("list_exchange_conversations", { p_offset: (page - 1) * 30 });
  if (error) return <p role="alert" className="text-destructive">Could not load conversations. Please refresh. On a new setup, run the prompt 8 SQL first.</p>;
  const rows = (data ?? []) as Conversation[];
  return <>
    {rows.length ? <ul className="space-y-3">{rows.slice(0, 30).map(row => <li key={row.exchange_id}>
      <Link prefetch={false} href={`/messages/${row.exchange_id}`} className="block space-y-2 surface-card p-5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
        <div className="flex items-center gap-2"><span className="break-words font-semibold">{row.other_name}</span>{row.unread && <span className="size-2 shrink-0 rounded-full bg-primary"><span className="sr-only">Unread messages</span></span>}</div>
        <p className="line-clamp-2 break-words text-sm text-muted-foreground">{row.last_body ?? "No messages yet. Start the conversation."}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(row.activity_at)}</p>
      </Link>
    </li>)}</ul> : <div className="space-y-3 surface-card p-5"><p>No conversations here yet. Conversations start from an exchange request.</p><Link className="inline-flex min-h-11 items-center text-primary underline" href="/discover">Find an exchange partner</Link></div>}
    <nav aria-label="Conversation pages" className="flex gap-5">{page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/messages?page=${page - 1}`}>Previous</Link>}{rows.length > 30 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/messages?page=${page + 1}`}>Next</Link>}</nav>
  </>;
}

export default function MessagesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <div className="mx-auto max-w-3xl space-y-6"><PageIntro title="Keep the conversation going" description="Plan your next exchange in a private conversation. Refresh for new messages."><RefreshButton /></PageIntro><Suspense fallback={<LoadingState label="Loading conversations…" />}><Conversations searchParams={searchParams} /></Suspense></div>;
}
