import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { StudentIdentity } from "@/components/students/student-card";
import { SkillBadge } from "@/components/students/skill-badge";
import { Button } from "@/components/ui/button";

async function StudentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return <p role="alert" className="text-destructive">Could not verify your account. Please sign in again.</p>;
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase.from("profiles").select("id, display_name, college, program, year_level, bio").eq("id", id).maybeSingle();
  if (error) return <p role="alert" className="text-destructive">Could not load this profile. Please reload to try again.</p>;
  if (!profile) notFound();
  const { data: rows, error: skillsError } = await supabase.from("profile_skills").select("skill_id, kind, skills(name)").eq("profile_id", id).order("skill_id");
  const ownProfile = user.id === id;
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-heading">Student profile</h1>
      <div className="space-y-4 surface-card p-5">
        <StudentIdentity student={profile} heading="h2" />
        <p className="whitespace-pre-line break-words text-muted-foreground">{profile.bio || "No introduction added yet."}</p>
        <Button asChild className="min-h-11"><Link href={ownProfile ? "/profile" : `/exchanges/new?to=${id}`}>{ownProfile ? "Edit profile" : "Request exchange"}</Link></Button>
      </div>
      {skillsError ? <p role="alert" className="text-destructive">Could not load this student&apos;s skills. Please reload to try again.</p> : ([{ kind: "teach", title: "Can teach" }, { kind: "learn", title: "Wants to learn" }].map((group) => {
        const skills = (rows ?? []).filter((row) => row.kind === group.kind);
        return (
          <section key={group.kind} className="space-y-3 surface-card p-5">
            <h2 className="text-lg font-semibold">{group.title}</h2>
            {skills.length ? <div className="flex flex-wrap gap-2">{skills.map((row) => <SkillBadge key={row.skill_id} name={pickOne<{ name: string }>(row.skills)?.name ?? "Unnamed skill"} />)}</div> : (
              <p className="text-sm text-muted-foreground">No skills added here yet. {ownProfile ? <Link href="/skills" className="text-primary underline">Add your skills</Link> : <Link href="/discover" className="text-primary underline">Browse other students</Link>}</p>
            )}
          </section>
        );
      }))}
      <Link href="/discover" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to Discover</Link>
    </article>
  );
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<LoadingState label="Loading student profile..." />}><StudentProfile params={params} /></Suspense>;
}
