import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadSessionCards } from "@/lib/group-sessions";
import { SessionCard } from "@/components/sessions/session-card";
import { Button } from "@/components/ui/button";

export async function MySessionList({ mode }: { mode: "registered" | "organized" }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  let result: Awaited<ReturnType<typeof loadSessionCards>>;
  try { result = await loadSessionCards(supabase, mode === "registered" ? { registeredId: user.id } : { organizerId: user.id }); }
  catch { return <p role="alert" className="text-destructive">Could not load your sessions. Please reload to try again.</p>; }
  const upcoming = result.sessions.filter((session) => session.status === "published" && Date.parse(session.starts_at) > result.now);
  const upcomingIds = new Set(upcoming.map((session) => session.id));
  const past = result.sessions.filter((session) => !upcomingIds.has(session.id)).sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));
  const href = mode === "registered" ? "/sessions" : "/sessions/new";
  const action = mode === "registered" ? "Browse sessions" : "Host a session";
  return <div className="space-y-8">{[{ title: "Upcoming", sessions: upcoming }, { title: "Past", sessions: past }].map((group) => <section key={group.title} className="space-y-4">
    <h2 className="text-xl font-semibold">{group.title}</h2>
    {!group.sessions.length ? <div className="space-y-3 rounded-xl border border-dashed p-6"><p>No {group.title.toLowerCase()} sessions here yet.</p><Button asChild variant="outline" className="min-h-11"><Link href={href}>{action}</Link></Button></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.sessions.map((session) => <div key={session.id} className="min-w-0 space-y-2">
      <SessionCard session={session} registrationBadge={mode === "registered" ? session.status === "cancelled" ? "Cancelled by organizer" : session.status === "completed" ? "Completed" : "Registered" : undefined} />
      {mode === "organized" && <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-11"><Link href={`/sessions/${session.id}`}>View<span className="sr-only"> {session.title}</span></Link></Button>{session.status === "published" && <Button asChild variant="outline" className="min-h-11"><Link href={`/sessions/${session.id}/edit`}>Edit<span className="sr-only"> {session.title}</span></Link></Button>}</div>}
    </div>)}</div>}
  </section>)}</div>;
}
