import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadLearningOptions } from "@/lib/paid-lessons";
import { ExchangeForm } from "@/components/exchanges/exchange-form";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function RequestNotice({ children, href = "/discover", action = "Browse students" }: { children: React.ReactNode; href?: string; action?: string }) {
  return <div className="space-y-4 surface-card p-5"><p>{children}</p><Button asChild variant="outline" className="min-h-11"><Link href={href}>{action}</Link></Button></div>;
}

async function RequestLoader({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const recipientId = z.string().uuid().safeParse(params.to);
  if (!recipientId.success) return <RequestNotice>Choose a student from Discover before requesting an exchange.</RequestNotice>;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  if (recipientId.data === user.id) return <RequestNotice>You cannot request an exchange with yourself. Choose another student.</RequestNotice>;
  const recipientResult = await supabase.from("profiles").select("id, display_name").eq("id", recipientId.data).maybeSingle();
  if (recipientResult.error) return <p role="alert">Could not load this student. Reload to try again.</p>;
  if (!recipientResult.data) return <RequestNotice>This student could not be found.</RequestNotice>;
  let options;
  try { options = (await loadLearningOptions(supabase,user.id,[recipientId.data])).get(recipientId.data); }
  catch { return <p role="alert">Could not check complementary skills. Apply Teacher Prompt 3 SQL on a new deployment, then reload.</p>; }
  if (!options?.mutual) return <RequestNotice href={`/students/${recipientId.data}`} action="View learning options">A free swap requires skills you both want to learn from each other. Unrelated teaching skills do not qualify. Check this tutor&apos;s paid offerings instead.</RequestNotice>;
  const teachSkills = options.iTeachThem;
  const learnSkills = options.teachesMe;
  const initialSkill = (value: string | string[] | undefined, choices: { id: number }[]) => {
    const parsed = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).safeParse(value);
    return parsed.success && choices.some((skill) => skill.id === parsed.data) ? parsed.data : undefined;
  };
  return <ExchangeForm recipientId={recipientResult.data.id} recipientName={recipientResult.data.display_name} learnSkills={learnSkills} teachSkills={teachSkills} initialLearn={initialSkill(params.learn, learnSkills)} initialTeach={initialSkill(params.teach, teachSkills)} />;
}

export default function NewExchangePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header><h1 className="page-heading">Request an exchange</h1><p className="mt-1 text-muted-foreground">Offer a skill and ask to learn one in return.</p></header>
      <Suspense fallback={<LoadingState label="Loading request form..." variant="form" />}><RequestLoader searchParams={searchParams} /></Suspense>
    </div>
  );
}
