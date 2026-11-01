import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { Button } from "@/components/ui/button";
import { SessionCard, type SessionCardData } from "@/components/sessions/session-card";

async function SessionList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_sessions")
    .select("id, title, starts_at, format, capacity, skills(name), profiles!group_sessions_organizer_id_fkey(display_name)")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) return <p className="text-destructive">Could not load sessions.</p>;

  const ids = (data ?? []).map((row) => row.id);
  const { data: counts } = await supabase.rpc("registration_counts", {
    p_session_ids: ids,
  });
  const countMap = new Map<string, number>(
    (counts ?? []).map((c: { session_id: string; registered: number }) => [
      c.session_id,
      Number(c.registered),
    ])
  );

  const sessions: SessionCardData[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    starts_at: row.starts_at,
    format: row.format,
    capacity: row.capacity,
    skillName: pickOne<{ name: string }>(row.skills)?.name ?? null,
    organizerName: pickOne<{ display_name: string }>(row.profiles)?.display_name ?? null,
    registered: countMap.get(row.id) ?? 0,
  }));

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-10 text-center">
        <p className="font-medium">No upcoming sessions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to share something you know.
        </p>
        <Button asChild className="mt-4">
          <Link href="/sessions/new">Host a session</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Group sessions</h1>
          <p className="mt-1 text-muted-foreground">
            Workshops and tutoring sessions hosted by MMSU students.
          </p>
        </div>
        <Button asChild>
          <Link href="/sessions/new">Host a session</Link>
        </Button>
      </div>
      <Suspense fallback={<p>Loading sessions...</p>}>
        <SessionList />
      </Suspense>
    </div>
  );
}