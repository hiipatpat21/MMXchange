import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { ExchangeForm } from "@/components/exchanges/exchange-form";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function RequestNotice({ children, href = "/discover", action = "Browse students" }: { children: React.ReactNode; href?: string; action?: string }) {
  return <div className="space-y-4 rounded-xl border bg-card p-5"><p>{children}</p><Button asChild variant="outline" className="min-h-10"><Link href={href}>{action}</Link></Button></div>;
}

async function RequestLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const recipientId = z.string().uuid().safeParse(params.to);
  if (!recipientId.success) return <RequestNotice>Choose a student from Discover before requesting an exchange.</RequestNotice>;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  if (recipientId.data === user.id) return <RequestNotice>You cannot request an exchange with yourself. Choose another student.</RequestNotice>;
  const [recipientResult, mineResult, theirsResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name").eq("id", recipientId.data).maybeSingle(),
    supabase.from("profile_skills").select("skill_id, skills(name)").eq("profile_id", user.id).eq("kind", "teach").order("skill_id"),
    supabase.from("profile_skills").select("skill_id, skills(name)").eq("profile_id", recipientId.data).eq("kind", "teach").order("skill_id"),
  ]);
  if (recipientResult.error || mineResult.error || theirsResult.error) return <p role="alert" className="text-destructive">Could not load the request form. Please reload to try again.</p>;
  if (!recipientResult.data) return <RequestNotice>This student could not be found. Choose another student.</RequestNotice>;
  const namedSkills = (rows: NonNullable<typeof mineResult.data>) => rows.map((row) => ({ id: row.skill_id as number, name: pickOne<{ name: string }>(row.skills)?.name ?? "Unnamed skill" })).sort((a, b) => a.name.localeCompare(b.name));
  const teachSkills = namedSkills(mineResult.data ?? []);
  const learnSkills = namedSkills(theirsResult.data ?? []);
  if (!teachSkills.length) return <RequestNotice href="/skills" action="Add teaching skills">Add a skill you can teach before requesting a mutual exchange.</RequestNotice>;
  if (!learnSkills.length) return <RequestNotice>This student has no teaching skills listed yet. Try another student.</RequestNotice>;
  const initialSkill = (value: string | string[] | undefined, choices: { id: number }[]) => {
    const parsed = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).safeParse(value);
    return parsed.success && choices.some((skill) => skill.id === parsed.data) ? parsed.data : undefined;
  };
  return <ExchangeForm recipientId={recipientResult.data.id} recipientName={recipientResult.data.display_name} learnSkills={learnSkills} teachSkills={teachSkills} initialLearn={initialSkill(params.learn, learnSkills)} initialTeach={initialSkill(params.teach, teachSkills)} />;
}

export default function NewExchangePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header><h1 className="text-2xl font-semibold">Request an exchange</h1><p className="mt-1 text-muted-foreground">Offer a skill and ask to learn one in return.</p></header>
      <Suspense fallback={<p role="status">Loading request form...</p>}><RequestLoader searchParams={searchParams} /></Suspense>
    </div>
  );
}
