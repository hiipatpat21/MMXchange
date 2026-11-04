import { getDashboardContext, getDashboardMatches, chooseDashboardSuggestion } from "@/lib/dashboard";
import { DashboardError } from "@/components/dashboard/dashboard-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <section className="dashboard-panel space-y-5" aria-labelledby="next-step-heading">
      <h2 id="next-step-heading" className="text-base font-semibold">Your next step</h2>
      <h3 className="max-w-lg text-2xl font-medium leading-tight">{suggestion.title}</h3>
      <p className="max-w-lg text-sm text-muted-foreground">{suggestion.reason}</p>
      <Button asChild><Link href={suggestion.href}>{suggestion.label}<span aria-hidden="true">→</span></Link></Button>
    </section>
  );
}
