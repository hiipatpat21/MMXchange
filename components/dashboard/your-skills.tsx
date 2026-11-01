import { getDashboardContext } from "@/lib/dashboard";
import { pickOne } from "@/lib/relations";
import { SkillBadge } from "@/components/students/skill-badge";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function YourSkills() {
  const { supabase, user } = await getDashboardContext();
  const [teach, learn] = await Promise.all([
    supabase.from("profile_skills").select("skill_id, skills!skill_id(name)").eq("profile_id", user.id).eq("kind", "teach").order("created_at", { ascending: false }).order("skill_id").limit(6),
    supabase.from("profile_skills").select("skill_id, skills!skill_id(name)").eq("profile_id", user.id).eq("kind", "learn").order("created_at", { ascending: false }).order("skill_id").limit(6),
  ]);
  if (teach.error || learn.error) return <DashboardError title="Your skills" />;
  return (
    <DashboardSection title="Your skills" href="/skills" actionLabel="Edit skills">
      {!teach.data.length && !learn.data.length ? <DashboardEmpty message="Tell us what you can teach and what you want to learn to help find learning partners." href="/skills" label="Add your skills" /> : <>
        {[{ title: "Can teach", rows: teach.data }, { title: "Want to learn", rows: learn.data }].map((group) => <div key={group.title} className="space-y-2"><h3 className="text-sm font-semibold">{group.title}</h3>{group.rows.length ? <div className="flex flex-wrap gap-2">{group.rows.map((row) => <SkillBadge key={row.skill_id} name={pickOne<{ name: string }>(row.skills)?.name ?? "Unnamed skill"} />)}</div> : <p className="text-sm text-muted-foreground">No skills added here yet. Use Edit skills to add one.</p>}</div>)}
        <p className="text-xs text-muted-foreground">Showing up to 6 recent skills per list. Edit skills to view all.</p>
      </>}
    </DashboardSection>
  );
}
