import { getDashboardContext, getDashboardMatches, chooseDashboardSuggestion } from "@/lib/dashboard";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function SuggestedNextStep() {
  const { supabase, user } = await getDashboardContext();
  let matches: Awaited<ReturnType<typeof getDashboardMatches>>;
  let queries;
  try {
    const [matching, ...results] = await Promise.all([
      getDashboardMatches(),
      supabase.from("profile_skills").select("skill_id").eq("profile_id", user.id).eq("kind", "teach").limit(1),
      supabase.from("group_session_registrations").select("session_id").eq("profile_id", user.id).limit(1),
      // The scheduling functions keep an exchange 'accepted' until it has a
      // scheduled slot, and restore it when the last slot is cancelled.
      supabase.from("exchange_requests").select("id").eq("status", "accepted").order("created_at").order("id").limit(1),
      supabase.from("group_sessions").select("id").eq("organizer_id", user.id).limit(1),
    ]);
    matches = matching;
    queries = results;
  } catch { return <DashboardError title="Suggested next step" />; }
  const [teach, registrations, accepted, hosted] = queries;
  if (queries.some((result) => result.error)) return <DashboardError title="Suggested next step" />;
  const suggestion = chooseDashboardSuggestion({
    hasTeachingSkill: !!teach.data?.length,
    hasMatches: matches.matches.length > 0,
    hasRegistration: !!registrations.data?.length,
    acceptedExchangeId: accepted.data?.[0]?.id ?? null,
    hasHosted: !!hosted.data?.length,
  });
  return (
    <DashboardSection title="Suggested next step">
      <h3 className="font-medium">{suggestion.title}</h3>
      <DashboardEmpty message={suggestion.reason} href={suggestion.href} label={suggestion.label} />
    </DashboardSection>
  );
}
