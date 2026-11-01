import { getDashboardContext } from "@/lib/dashboard";
import { loadSessionCards } from "@/lib/group-sessions";
import { SessionCard } from "@/components/sessions/session-card";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function UpcomingGroups() {
  const { supabase, user } = await getDashboardContext();
  let result: Awaited<ReturnType<typeof loadSessionCards>>;
  try {
    result = await loadSessionCards(supabase, { limit: 3, upcomingOnly: true, availableOnly: true, registrationOpenOnly: true, excludeOrganizerId: user.id });
  } catch { return <DashboardError title="Upcoming group sessions" />; }
  return (
    <DashboardSection title="Upcoming group sessions" href="/sessions" actionLabel="Browse all">
      {!result.sessions.length ? <DashboardEmpty message="No upcoming sessions have open registration and available seats. You can check back or host a session." href="/sessions/new" label="Host a session" /> : <div className="space-y-3">{result.sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>}
    </DashboardSection>
  );
}
