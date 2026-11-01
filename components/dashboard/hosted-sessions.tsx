import { getDashboardContext } from "@/lib/dashboard";
import { loadSessionCards } from "@/lib/group-sessions";
import { SessionCard } from "@/components/sessions/session-card";
import { DashboardSection, DashboardError } from "@/components/dashboard/dashboard-section";

export async function HostedSessions() {
  const { supabase, user } = await getDashboardContext();
  let result: Awaited<ReturnType<typeof loadSessionCards>>;
  try { result = await loadSessionCards(supabase, { organizerId: user.id, upcomingOnly: true, limit: 3 }); }
  catch { return <DashboardError title="Sessions you're hosting" />; }
  if (!result.sessions.length) return null;
  return (
    <DashboardSection title="Sessions you're hosting" href="/sessions/organized" actionLabel="Manage sessions">
      <div className="space-y-3">{result.sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>
    </DashboardSection>
  );
}
