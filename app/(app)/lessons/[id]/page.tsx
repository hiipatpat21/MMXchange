import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { paidRequestSelect, loadPaidLessonState, formatPhp, type PaidRequest } from "@/lib/paid-lessons";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { LessonAction } from "@/components/lessons/lesson-action";
import { LessonComposer } from "@/components/lessons/lesson-composer";
import { LessonThread } from "@/components/lessons/lesson-thread";
import { RefreshButton } from "@/components/messages/refresh-button";
import { LoadingState } from "@/components/ui/loading-state";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string; beforeId?: string }> };
async function LessonLoader({ params, searchParams }: Props) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client.from("paid_lesson_requests").select(paidRequestSelect).eq("id", id).maybeSingle();
  if (error) return <p role="alert">Could not load this lesson. Reload to try again.</p>;
  if (!data) notFound();
  const row = data as PaidRequest;
  if (![row.learner_id,row.tutor_id].includes(user.id)) notFound();
  const { booking, payment, review, now } = await loadPaidLessonState(client,id);
  if (booking.error || payment.error || review.error) return <p role="alert">Could not load the meeting, payment or feedback status. Refresh to try again.</p>;
  const isTutor = user.id === row.tutor_id;
  const started = booking.data && Date.parse(booking.data.starts_at) <= now;
  const ownConfirmation = isTutor ? row.tutor_completed_at : row.learner_completed_at;
  const canComplete = row.status === "accepted" && booking.data?.status === "confirmed" && payment.data?.status === "confirmed" && started && !ownConfirmation;
  const canCancel = (row.status === "pending" && !isTutor) || (row.status === "accepted" && (!started || !["confirmed", "completed"].includes(booking.data?.status ?? "")));
  return <article className="mx-auto max-w-3xl space-y-6">
    <header className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="page-heading">{row.skill_name} lesson</h1><RefreshButton /></div><p>With {pickOne(isTutor ? row.learner : row.tutor)?.display_name ?? "Student"}</p><p className="font-semibold">{formatPhp(row.agreed_price_centavos ?? row.quoted_price_centavos)} / one-hour lesson {row.accepted_at ? "(agreed fee)" : "(quoted fee)"}</p></header>
    <section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Your next step</h2>
      <dl className="grid gap-3 sm:grid-cols-3"><div><dt className="text-sm text-muted-foreground">Request</dt><dd>{row.status}</dd></div><div><dt className="text-sm text-muted-foreground">Meeting</dt><dd>{booking.data?.status ?? "Not reserved"}</dd></div><div><dt className="text-sm text-muted-foreground">Payment</dt><dd>{payment.data?.status.replaceAll("_", " ") ?? "Not requested"}</dd></div></dl>
      {row.status === "pending" && <p className="text-sm">{isTutor ? "Review the learner's goals and quoted fee before accepting." : "Waiting for the tutor to review your request."}</p>}
      {row.status === "accepted" && !booking.data && <p className="text-sm">Accepted only. No meeting or payment is confirmed. Scheduling and payment controls arrive in Prompts 4-5; no payment is due yet.</p>}
      {booking.data && <p>{formatDateTime(booking.data.starts_at)} - {booking.data.format === "online" ? "Online" : "In person"}: <span className="break-words">{booking.data.venue}</span></p>}
      {ownConfirmation && row.status !== "completed" && <p>Waiting for your learning partner to confirm completion.</p>}
      <div className="flex flex-wrap gap-3">{row.status === "pending" && isTutor && <><LessonAction id={id} action="accept" price={row.quoted_price_centavos} label={`Accept at ${formatPhp(row.quoted_price_centavos)}`} /><LessonAction id={id} action="decline" label="Decline request" /></>}{canCancel && <LessonAction id={id} action="cancel" label="Cancel request" />}{canComplete && <LessonAction id={id} action="complete" label="Confirm lesson completed" />}</div>
      <p className="text-sm text-muted-foreground">The learner may cancel a pending request. After acceptance, either participant may cancel before a confirmed meeting starts. Unpaid reservations can be cancelled even after their time passes. If money was sent, arrange refunds directly; MMXchange does not refund or guarantee payment.</p>
    </section>
    <details className="disclosure"><summary>Learning goals</summary><p className="whitespace-pre-wrap break-words pb-4">{row.message}</p></details>
    <section id="conversation" className="space-y-4"><h2 className="text-xl font-semibold">Conversation</h2><Suspense fallback={<LoadingState label="Loading lesson messages..." />}><LessonThread id={id} userId={user.id} accepted={!!row.accepted_at} open={row.status === "accepted"} cursor={await searchParams} /></Suspense></section>
    {row.status === "completed" && <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">Lesson feedback</h2>{review.data ? <><p>{review.data.rating} / 5</p><p className="whitespace-pre-wrap break-words">{review.data.comment}</p></> : !isTutor ? <LessonComposer id={id} kind="review" /> : <p>The learner has not submitted feedback yet.</p>}</section>}
    <Link href="/exchanges" className="inline-flex min-h-11 items-center text-primary underline">Back to My learning</Link>
  </article>;
}
export default function LessonPage(props: Props) { return <Suspense fallback={<LoadingState label="Loading paid lesson..." />}><LessonLoader {...props} /></Suspense>; }
