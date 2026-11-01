import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { loadSessionCards } from "@/lib/group-sessions";
import { formatDateTime } from "@/lib/datetime";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function RegisteredSessions() {
  const { supabase, user } = await getDashboardContext();
  let result: Awaited<ReturnType<typeof loadSessionCards>>;
  try { result = await loadSessionCards(supabase, { registeredId: user.id, upcomingOnly: true, limit: 3 }); }
  catch { return <DashboardError title="My registered sessions" />; }
  return (
    <DashboardSection title="My registered sessions" href="/sessions/registered" actionLabel="My registrations">
      {!result.sessions.length ? <DashboardEmpty message="You have no upcoming group sessions to attend. Join one to learn without arranging a swap." href="/sessions" label="Find a group session" /> : <ul className="divide-y">{result.sessions.map((session) => <li key={session.id} className="py-3"><Link href={`/sessions/${session.id}`} className="block min-h-10 space-y-1 rounded-lg p-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><p className="break-words font-medium">{session.title}</p><p className="text-sm text-muted-foreground">{formatDateTime(session.starts_at)}</p><span className="text-sm text-primary underline">View session</span></Link></li>)}</ul>}
    </DashboardSection>
  );
}
