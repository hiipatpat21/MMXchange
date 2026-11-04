import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { DashboardError } from "@/components/dashboard/dashboard-section";

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
    <aside className="flex flex-wrap items-center justify-between gap-x-4 rounded-xl bg-brand-gold/15 px-4 py-2 text-sm text-primary" aria-label="Profile suggestion"><p>A little more about you helps partners connect.</p><Link href={missing[0].href} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">{missing[0].label} <span aria-hidden="true" className="ml-2">→</span></Link></aside>
  );
}
