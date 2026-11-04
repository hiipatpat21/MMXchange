import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMatchesForUser } from "@/lib/matching";
import { MatchCard } from "@/components/students/match-card";
import { StudentCard } from "@/components/students/student-card";
import { StudentFiltersForm } from "@/components/students/student-filters";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/layout/page-intro";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const filterSchema = z.object({
  q: z.string().trim().max(100),
  category: z.string().max(100),
  skill: z.union([z.literal(""), z.string().regex(/^[1-9]\d*$/).refine((value) => Number.isSafeInteger(Number(value)))]),
  college: z.string().max(200),
});

async function Recommendations({ supabase, userId }: { supabase: Awaited<ReturnType<typeof createClient>>; userId: string }) {
  let result: Awaited<ReturnType<typeof getMatchesForUser>>;
  try {
    result = await getMatchesForUser(supabase, userId, { limit: 30 });
  } catch {
    return <p role="alert" className="text-destructive">Could not load recommendations. Please reload to try again.</p>;
  }
  const { hasSkills, matches } = result;
    if (!hasSkills) return (
      <div className="rounded-xl border border-dashed p-6">
        <p className="font-medium">Add skills to find learning partners</p>
        <p className="mt-1 text-sm text-muted-foreground">Tell us what you can teach and what you want to learn to get recommendations.</p>
        <Button asChild className="mt-4 min-h-11"><Link href="/skills">Add your skills</Link></Button>
      </div>
    );
    if (!matches.length) return (
      <div className="rounded-xl border border-dashed p-6">
        <p className="font-medium">No matching students yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adding more skills, or explore group sessions for another way to learn.</p>
        <Button asChild variant="outline" className="mt-4 min-h-11"><Link href="/sessions">Browse group sessions</Link></Button>
      </div>
    );
    return <div className="grid gap-4 lg:grid-cols-2">{matches.map((match) => <MatchCard key={match.profile.id} match={match} />)}</div>;
}

async function BrowseStudents({ supabase, userId, searchParams }: { supabase: Awaited<ReturnType<typeof createClient>>; userId: string; searchParams: SearchParams }) {
  const params = await searchParams;
  const parsed = filterSchema.safeParse({ q: params.q ?? "", category: params.category ?? "", skill: params.skill ?? "", college: params.college ?? "" });
  if (!parsed.success) return <p role="alert" className="text-destructive">These filters are invalid. <Link href="/discover?view=browse" className="underline">Clear filters</Link> and try again.</p>;
  const filters = parsed.data;
  const { data: skills, error: skillsError } = await supabase.from("skills").select("id, name, category").order("name");
  if (skillsError) return <p role="alert" className="text-destructive">Could not load filter options. Please reload to try again.</p>;

  // Inner joins require a matching teaching row before the 30-profile limit.
  // Both skill filters apply to that same teaching row.
  const teachingFilter = !!(filters.category || filters.skill);
  let query = (teachingFilter
    ? supabase.from("profiles").select("id, display_name, college, program, year_level, bio, avatar_url, created_at, profile_skills!inner(skill_id, kind, skills!inner(category))")
    : supabase.from("profiles").select("id, display_name, college, program, year_level, bio, avatar_url, created_at")
  ).neq("id", userId);
  if (filters.q) query = query.ilike("display_name", `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`);
  if (filters.college) query = query.eq("college", filters.college);
  if (teachingFilter) query = query.eq("profile_skills.kind", "teach");
  if (filters.category) query = query.eq("profile_skills.skills.category", filters.category);
  if (filters.skill) query = query.eq("profile_skills.skill_id", Number(filters.skill));
  const { data, error } = await query.order("created_at", { ascending: false }).order("id").limit(30);
  const students = data ?? [];
  return (
    <div className="space-y-4">
      <StudentFiltersForm filters={filters} skills={skills} />
      {error ? <p role="alert" className="text-destructive">Could not load students. Please reload to try again.</p> : students.length ? (
        <>
          <p className="text-sm text-muted-foreground">Showing up to 30 students, newest profiles first.</p>
          <div className="grid gap-4 lg:grid-cols-2">{students.map((student) => <StudentCard key={student.id} student={student} />)}</div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-6">
          <p className="font-medium">No students match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Clear your filters or check back as more students join.</p>
          <Button asChild variant="outline" className="mt-4 min-h-11"><Link href="/discover?view=browse">Clear filters</Link></Button>
        </div>
      )}
    </div>
  );
}

async function DiscoverContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return <p role="alert" className="text-destructive">Could not verify your account. Please sign in again.</p>;
  if (!user) redirect("/login");
  const query = await searchParams;
  const view = query.view === "browse" || query.q || query.category || query.skill || query.college ? "browse" : "recommended";
  return (
    <>
      <nav aria-label="Discover views" className="section-tabs"><Link href="/discover" aria-current={view === "recommended" ? "page" : undefined}>Your matches</Link><Link href="/discover?view=browse" aria-current={view === "browse" ? "page" : undefined}>Browse everyone</Link></nav>
      {view === "recommended" ?
      <section className="space-y-4" aria-labelledby="recommended-heading">
        <h2 id="recommended-heading" className="sr-only">Recommended for you</h2>
        <Suspense fallback={<LoadingState label="Finding learning partners..." />}><Recommendations supabase={supabase} userId={user.id} /></Suspense>
      </section> :
      <section className="space-y-4" aria-labelledby="browse-heading">
        <h2 id="browse-heading" className="sr-only">Browse students</h2>
        <Suspense fallback={<LoadingState label="Loading students and filters..." />}><BrowseStudents supabase={supabase} userId={user.id} searchParams={searchParams} /></Suspense>
      </section>}
    </>
  );
}

export default function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-8">
      <PageIntro title="Find your learning people" description="You know something they want to learn. They might know your next favorite skill." />
      <Suspense fallback={<LoadingState label="Loading discovery..." />}><DiscoverContent searchParams={searchParams} /></Suspense>
    </div>
  );
}
