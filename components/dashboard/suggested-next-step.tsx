import { getDashboardContext, getDashboardMatches, chooseDashboardSuggestion } from "@/lib/dashboard";
import { DashboardError } from "@/components/dashboard/dashboard-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LearningIllustration } from "@/components/ui/learning-illustration";

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
    <section className="dashboard-panel next-step-panel" aria-labelledby="next-step-heading">
      <h2 id="next-step-heading" className="text-lg font-bold">Your next step</h2>
      <h3 className="max-w-lg text-xl font-bold leading-tight sm:text-2xl">{suggestion.title}</h3>
      <div className="flex items-center gap-4">
        <p className="min-w-0 flex-1 text-base text-muted-foreground">{suggestion.reason}</p>
        <LearningIllustration scene="curious" className="w-24 shrink-0 sm:w-28" sizes="(max-width: 639px) 96px, 112px" />
      </div>
      <Button asChild><Link href={suggestion.href}>{suggestion.label}<span aria-hidden="true">→</span></Link></Button>
    </section>
  );
}
