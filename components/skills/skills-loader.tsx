import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SkillSection } from "@/components/skills/skill-section";

export async function SkillsLoader({ onboarding = false }: { onboarding?: boolean } = {}) {
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

  if (!allSkills?.length) return <div className="space-y-3 rounded-xl border bg-card p-6">
    <p>No skills are available in the catalog yet. You can add your choices later.</p>
    {!onboarding && <Link href="/dashboard" className="inline-flex min-h-11 items-center text-primary underline">Back to Home</Link>}
  </div>;
  const skills = allSkills;
  const chosen = new Map((mine ?? []).map((r) => [r.skill_id, r.kind]));

  const teach = skills.filter((s) => chosen.get(s.id) === "teach");
  const learn = skills.filter((s) => chosen.get(s.id) === "learn");
  const available = skills.filter((s) => !chosen.has(s.id));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SkillSection
        title="Skills I can teach"
        kind="teach"
        chosen={teach}
        available={available}
      />
      <SkillSection
        title="Skills I want to learn"
        kind="learn"
        chosen={learn}
        available={available}
      />
    </div>
  );
}

