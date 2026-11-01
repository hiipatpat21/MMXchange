import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { DashboardSection, DashboardError } from "@/components/dashboard/dashboard-section";

export async function ProfileChecklist() {
  const { supabase, user } = await getDashboardContext();
  const [profile, teach, learn] = await Promise.all([
    supabase.from("profiles").select("college, program, bio").eq("id", user.id).maybeSingle(),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", user.id).eq("kind", "teach").limit(1),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", user.id).eq("kind", "learn").limit(1),
  ]);
  if (profile.error || teach.error || learn.error || !profile.data) return <DashboardError title="Complete your profile" />;
  const missing = [
    { label: "Add your college and program", href: "/profile", done: !!profile.data.college?.trim() && !!profile.data.program?.trim() },
    { label: "Write a short introduction", href: "/profile", done: !!profile.data.bio?.trim() },
    { label: "Add a skill you can teach", href: "/skills", done: !!teach.data?.length },
    { label: "Add a skill you want to learn", href: "/skills", done: !!learn.data?.length },
  ].filter((item) => !item.done);
  if (!missing.length) return null;
  return (
    <DashboardSection title="Complete your profile">
      <p className="text-sm text-muted-foreground">Help other students understand what you want to learn and share.</p>
      <ul className="space-y-2">{missing.map((item) => <li key={item.label}><Link href={item.href} className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm text-primary underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-2 focus-visible:outline-primary"><span aria-hidden="true" className="size-4 shrink-0 rounded border" />{item.label}</Link></li>)}</ul>
    </DashboardSection>
  );
}
