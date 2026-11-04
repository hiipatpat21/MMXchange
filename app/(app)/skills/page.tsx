import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SkillSection } from "@/components/skills/skill-section";
import { PageIntro } from "@/components/layout/page-intro";

async function SkillsLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: allSkills, error: skillsError }, { data: mine, error: mineError }] = await Promise.all([
    supabase.from("skills").select("id, name, category").order("name"),
    supabase.from("profile_skills").select("skill_id, kind").eq("profile_id", user.id),
  ]);
  if (skillsError || mineError) return <p role="alert" className="text-sm text-destructive">Could not load your skills. Please reload to try again.</p>;

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
      <PageIntro title="What’s your thing?" description="Something to share. Something to discover. Your two lists bring the right people together." />
      <Suspense fallback={<LoadingState label="Loading your skills..." />}>
        <SkillsLoader />
      </Suspense>
    </div>
  );
}
