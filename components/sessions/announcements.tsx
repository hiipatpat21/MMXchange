import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/datetime";
import { MessageForm } from "@/components/messages/message-form";
import { RefreshButton } from "@/components/messages/refresh-button";

export async function Announcements({ sessionId, organizer, published, before, beforeId }: { sessionId: string; organizer: boolean; published: boolean; before?: string; beforeId?: string }) {
  const supabase = await createClient();
  let request = supabase.from("session_announcements").select("id, body, created_at").eq("session_id", sessionId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(21);
  if (before && beforeId) request = request.or(`created_at.lt.${before},and(created_at.eq.${before},id.lt.${beforeId})`);
  const { data, error } = await request;
  const rows = (data ?? []).slice(0, 20);
  const oldest = rows.at(-1);
  if (!organizer && !error && !rows.length) return null;
  return <section className="space-y-4 surface-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Announcements</h2><RefreshButton /></div>
    <p className="text-sm text-muted-foreground">Updates from the organizer for registered students. Refresh to check for updates.</p>
    {organizer && published && <MessageForm id={sessionId} announcement />}
    {error ? <p role="alert" className="text-destructive">Could not load announcements. Please refresh. On a new setup, run the prompt 8 SQL first.</p> : rows.length ? <ul className="divide-y">{rows.map(row => <li key={row.id} className="space-y-2 py-4"><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{row.body}</p><p className="text-xs text-muted-foreground">Organizer · {formatDateTime(row.created_at)}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No announcements yet. Post an update for your registered students.</p>}
    {(data?.length ?? 0) > 20 && oldest && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/sessions/${sessionId}?${new URLSearchParams({ announcementBefore: oldest.created_at, announcementBeforeId: oldest.id })}`}>Older announcements</Link>}
    {before && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/sessions/${sessionId}`}>Latest announcements</Link>}
  </section>;
}
