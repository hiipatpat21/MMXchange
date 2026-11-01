import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SkillSection } from "@/components/skills/skill-section";

async function SkillsLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: allSkills }, { data: mine }] = await Promise.all([
    supabase.from("skills").select("id, name, category").order("name"),
    supabase.from("profile_skills").select("skill_id, kind").eq("profile_id", user.id),
  ]);

  const skills = allSkills ?? [];
  const chosen = new Map((mine ?? []).map((r) => [r.skill_id, r.kind]));

  const teach = skills.filter((s) => chosen.get(s.id) === "teach");
  const learn = skills.filter((s) => chosen.get(s.id) === "learn");
  const available = skills.filter((s) => !chosen.has(s.id));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SkillSection
        title="Skills I can teach"
        description="What could you help another student learn?"
        kind="teach"
        chosen={teach}
        available={available}
      />
      <SkillSection
        title="Skills I want to learn"
        description="What would you like someone to teach you?"
        kind="learn"
        chosen={learn}
        available={available}
      />
    </div>
  );
}

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="page-heading">My skills</h1>
        <p className="mt-1 text-muted-foreground">
          We use these two lists to suggest students you could swap skills with.
        </p>
      </div>
      <Suspense fallback={<LoadingState label="Loading your skills..." />}>
        <SkillsLoader />
      </Suspense>
    </div>
  );
}