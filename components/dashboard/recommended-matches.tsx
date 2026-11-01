import { getDashboardContext, getDashboardMatches } from "@/lib/dashboard";
import { MatchCard } from "@/components/students/match-card";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function RecommendedMatches() {
  await getDashboardContext();
  let result: Awaited<ReturnType<typeof getDashboardMatches>>;
  try { result = await getDashboardMatches(); }
  catch { return <DashboardError title="Recommended matches" />; }
  return (
    <DashboardSection title="Recommended matches" href="/discover" actionLabel="See all">
      {!result.hasSkills ? <DashboardEmpty message="Add teaching and learning skills to find potential partners." href="/skills" label="Add your skills" /> : !result.matches.length ? <DashboardEmpty message="No matching students yet. Group sessions offer another way to learn." href="/sessions" label="Browse group sessions" /> : <div className="space-y-3">{result.matches.map((match) => <MatchCard key={match.profile.id} match={match} compact />)}</div>}
    </DashboardSection>
  );
}
