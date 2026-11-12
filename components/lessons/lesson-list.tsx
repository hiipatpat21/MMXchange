import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { paidRequestSelect, formatPhp, type PaidRequest } from "@/lib/paid-lessons";
import { pickOne } from "@/lib/relations";
export async function PaidLessonList({ page = 1, conversations = false }: { page?: number; conversations?: boolean }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  let query = client.from("paid_lesson_requests").select(paidRequestSelect);
  if (conversations) query = query.not("accepted_at", "is", null);
  const { data, error } = await query.order("updated_at", { ascending: false }).order("id").range((page - 1) * 30, page * 30);
  if (error) return <p role="alert">Could not load paid lessons. Apply Teacher Prompt 3 SQL on a new deployment, then reload.</p>;
  const rows = (data ?? []) as PaidRequest[];
  return <section className="space-y-4"><h2 className="text-xl font-semibold">{conversations ? "Paid lesson conversations" : "Paid individual lessons"}</h2>
    {rows.length ? <ul className="space-y-3">{rows.slice(0,30).map(row => <li key={row.id}><Link href={`/lessons/${row.id}${conversations ? "#conversation" : ""}`} className="block space-y-1 rounded-xl border bg-card p-5 hover:border-primary/40"><span className="font-semibold">{row.skill_name}</span><span className="block text-sm">{pickOne(user.id === row.learner_id ? row.tutor : row.learner)?.display_name ?? "Student"} - {formatPhp(row.agreed_price_centavos ?? row.quoted_price_centavos)} / hour</span><span className="block text-sm text-muted-foreground">Request: {row.status}{row.status === "accepted" ? ". Acceptance alone does not confirm a meeting or payment." : ""}</span></Link></li>)}</ul> : <div className="space-y-2 rounded-xl border bg-card p-5"><p>{page > 1 ? "No lessons on this page." : "No paid lessons yet. Requests open after scheduling and payment setup is complete."}</p><Link href="/discover?view=browse" className="inline-flex min-h-11 items-center text-primary underline">Browse tutors</Link></div>}
    <nav aria-label="Paid lesson pages" className="flex gap-4">{page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`${conversations ? "/messages" : "/exchanges"}?lessonPage=${page - 1}`}>Previous paid lessons</Link>}{rows.length > 30 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`${conversations ? "/messages" : "/exchanges"}?lessonPage=${page + 1}`}>More paid lessons</Link>}</nav>
  </section>;
}
