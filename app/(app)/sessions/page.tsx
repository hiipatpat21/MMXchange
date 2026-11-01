import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadSessionCards, sessionFilterSchema } from "@/lib/group-sessions";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/sessions/session-card";
import { SessionTabs } from "@/components/sessions/session-tabs";
import { SessionFiltersForm } from "@/components/sessions/session-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function SessionList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const parsed = sessionFilterSchema.safeParse({ q: params.q ?? "", category: params.category ?? "", format: params.format ?? "", date: params.date ?? "", seats: params.seats ?? "" });
  if (!parsed.success) return <p role="alert" className="text-destructive">These filters are invalid. <Link href="/sessions" className="underline">Clear filters</Link> and try again.</p>;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: skills, error: skillsError } = await supabase.from("skills").select("category");
  if (skillsError) return <p role="alert" className="text-destructive">Could not load filter options. Please reload to try again.</p>;
  let result: Awaited<ReturnType<typeof loadSessionCards>>;
  try { result = await loadSessionCards(supabase, { filters: parsed.data }); }
  catch { return <p role="alert" className="text-destructive">Could not load sessions or seat counts. Please reload to try again.</p>; }
  const categories = [...new Set(skills.map((skill) => skill.category as string))].sort();
  return <div className="space-y-5">
    <SessionFiltersForm filters={parsed.data} categories={categories} />
    <h2 className="text-xl font-semibold">Upcoming sessions</h2>
    {result.sessions.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div> : <div className="space-y-3 rounded-xl border border-dashed bg-card p-6">
      <p className="font-medium">No upcoming sessions match these filters</p><p className="text-sm text-muted-foreground">Try clearing your filters, or share something you know by hosting a session.</p>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-10"><Link href="/sessions">Clear filters</Link></Button><Button asChild className="min-h-10"><Link href="/sessions/new">Host a session</Link></Button></div>
    </div>}
  </div>;
}

export default function SessionsPage({ searchParams }: { searchParams: SearchParams }) {
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><header><h1 className="text-2xl font-semibold">Group sessions</h1><p className="mt-1 text-muted-foreground">Workshops and tutoring sessions hosted by MMSU students.</p></header><Button asChild className="min-h-10"><Link href="/sessions/new">Host a session</Link></Button></div>
    <SessionTabs active="all" />
    <Suspense fallback={<p role="status">Loading sessions and filters...</p>}><SessionList searchParams={searchParams} /></Suspense>
  </div>;
}
