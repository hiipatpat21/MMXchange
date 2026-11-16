import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { formatDateTime } from "@/lib/datetime";
import { LessonComposer } from "@/components/lessons/lesson-composer";
export async function LessonThread({ id, userId, accepted, open, cursor }: { id: string; userId: string; accepted: boolean; open: boolean; cursor: { before?: string; beforeId?: string } }) {
  if (!accepted) return <p>Private messaging opens after the tutor accepts.</p>;
  const parsed = z.object({ before: z.iso.datetime({ offset: true }), beforeId: z.string().uuid() }).safeParse(cursor);
  if ((cursor.before || cursor.beforeId) && !parsed.success) return <p role="alert">Invalid message page. <Link className="underline" href={`/lessons/${id}`}>Open latest messages</Link>.</p>;
  const client = await createClient();
  let query = client.from("paid_lesson_messages").select("id, sender_id, body, created_at").eq("request_id", id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
  if (parsed.success) query = query.or(`created_at.lt.${parsed.data.before},and(created_at.eq.${parsed.data.before},id.lt.${parsed.data.beforeId})`);
  const { data, error } = await query;
  if (error) return <p role="alert">Could not load messages. Refresh to try again.</p>;
  const rows = (data ?? []).slice(0,50), oldest = rows.at(-1);
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Private chat. Refresh for new messages.</p>
    {rows.length ? <ol className="space-y-3">{[...rows].reverse().map(row => <li key={row.id} className="rounded-xl border bg-card p-4"><p className="text-sm font-medium">{row.sender_id === userId ? "You" : "Your learning partner"}</p><p className="whitespace-pre-wrap break-words">{row.body}</p><p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p></li>)}</ol> : <p>No messages yet. Start the conversation below.</p>}
    {(data?.length ?? 0) > 50 && oldest && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/lessons/${id}?${new URLSearchParams({ before: oldest.created_at, beforeId: oldest.id })}#conversation`}>Older messages</Link>}
    {parsed.success && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/lessons/${id}#conversation`}>Latest messages</Link>}
    {open ? <LessonComposer id={id} kind="message" /> : <p>This conversation is read-only because the lesson has ended.</p>}
  </div>;
}
