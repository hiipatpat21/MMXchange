import { getDashboardContext, getDashboardMatches } from "@/lib/dashboard";
import { MatchCard } from "@/components/students/match-card";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function RecommendedMatches() {
  await getDashboardContext();
  let result: Awaited<ReturnType<typeof getDashboardMatches>>;
  try { result = await getDashboardMatches(); }
  catch { return <DashboardError title="Recommended matches" />; }
  return (
    <DashboardSection title="People to learn with" href="/discover" actionLabel="Explore">
      {!result.hasSkills ? <DashboardEmpty message="A skill you share could start a great exchange." href="/skills" label="Add your skills" /> : !result.matches.length ? <DashboardEmpty message="No skill matches yet. Browse individual tutors or update your learning interests." href="/discover?view=browse" label="Browse tutors" /> : <div className="space-y-2">{result.matches.slice(0, 2).map((match) => <MatchCard key={match.profile.id} match={match} compact />)}</div>}
    </DashboardSection>
  );
}
