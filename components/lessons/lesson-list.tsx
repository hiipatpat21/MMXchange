import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { paidRequestSelect, formatPhp, type PaidRequest } from "@/lib/paid-lessons";
import { lessonGuide } from "@/lib/learning-guidance";
import { paymentLabels } from "@/lib/lesson-payments";
import { formatDateTime } from "@/lib/datetime";
import { loadLessonListState } from "@/lib/lesson-list-state";
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
  const related = conversations ? null : await loadLessonListState(client, rows.slice(0,30).map(row => row.id));
  if (related?.error) return <p role="alert">Could not load lesson meeting and payment details. Refresh to try again.</p>;
  return <section className="space-y-4"><h2 className="text-xl font-semibold">{conversations ? "Paid lesson conversations" : "Paid individual lessons"}</h2>
    {rows.length ? <ul className="space-y-3">{rows.slice(0,30).map(row => {
      const booking = related?.bookings.find(b => b.request_id === row.id);
      const payment = related?.payments.find(p => p.request_id === row.id);
      const guide = lessonGuide({ id:row.id,status:row.status,isTutor:user.id===row.tutor_id,booking,payment,now:related?.now ?? 0,ownConfirmed:!!(user.id===row.tutor_id ? row.tutor_completed_at : row.learner_completed_at) });
      return <li key={row.id}><Link href={conversations ? `/lessons/${row.id}#conversation` : guide.href} className="block min-w-0 space-y-2 rounded-xl border bg-card p-5 hover:border-primary/40"><span className="block break-words text-lg font-semibold">{row.skill_name}</span><span className="block break-words text-sm">{pickOne(user.id === row.learner_id ? row.tutor : row.learner)?.display_name ?? "Student"}</span><span className="block font-medium">{formatPhp(row.agreed_price_centavos ?? row.quoted_price_centavos)} / hour</span>{booking && <span className="block text-sm">{formatDateTime(booking.starts_at)} - {booking.status}</span>}{payment && <span className="block text-sm text-muted-foreground">{paymentLabels[payment.status]}</span>}<span className="block text-sm text-muted-foreground">{conversations ? row.status : guide.text}</span><span className="block text-sm font-medium text-primary">{conversations ? "Open conversation" : guide.label}</span></Link></li>;
    })}</ul> : <div className="space-y-2 rounded-xl border bg-card p-5"><p>{page > 1 ? "No lessons on this page." : "No paid lessons yet. Browse tutors to see offerings and whether requests are open."}</p><Link href="/discover?view=browse" className="inline-flex min-h-11 items-center text-primary underline">Browse tutors</Link></div>}
    <nav aria-label="Paid lesson pages" className="flex gap-4">{page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`${conversations ? "/messages" : "/exchanges?view=paid"}${conversations ? "?" : "&"}lessonPage=${page - 1}`}>Previous paid lessons</Link>}{rows.length > 30 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`${conversations ? "/messages" : "/exchanges?view=paid"}${conversations ? "?" : "&"}lessonPage=${page + 1}`}>More paid lessons</Link>}</nav>
  </section>;
}
