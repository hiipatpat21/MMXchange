import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { GroupSession } from "@/lib/group-sessions";
import { updateSession } from "@/app/(app)/sessions/actions";
import { SessionForm } from "@/components/sessions/session-form";

async function EditLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: session, error } = await supabase.from("group_sessions").select("*").eq("id", id).eq("organizer_id", user.id).maybeSingle();
  if (error) return <p role="alert" className="text-destructive">Could not load this session. Please reload to try again.</p>;
  if (!session) notFound();
  if (session.status !== "published") return <p>This session can no longer be edited. <Link href={`/sessions/${id}`} className="text-primary underline">View session</Link></p>;
  const { data: skills, error: skillsError } = await supabase.from("skills").select("id, name").order("name");
  if (skillsError) return <p role="alert" className="text-destructive">Could not load skill options. Please reload to try again.</p>;
  return <SessionForm skills={skills} initialValues={session as GroupSession} action={updateSession} />;
}

export default function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  return <div className="mx-auto max-w-2xl space-y-6"><h1 className="page-heading">Edit session</h1><Suspense fallback={<LoadingState label="Loading session editor..." variant="form" />}><EditLoader params={params} /></Suspense></div>;
}
