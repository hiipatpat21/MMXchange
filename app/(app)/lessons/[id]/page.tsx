import { PaidBookingForm } from "@/components/lessons/booking-form";
import { PaymentPanel } from "@/components/lessons/payment-panel";
import { paymentLabels } from "@/lib/lesson-payments";
import { lessonGuide } from "@/lib/learning-guidance";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { paidRequestSelect, PAID_BOOKING_READY, loadPaidLessonState, formatPhp, type PaidRequest } from "@/lib/paid-lessons";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { LessonAction } from "@/components/lessons/lesson-action";
import { LessonComposer } from "@/components/lessons/lesson-composer";
import { LessonThread } from "@/components/lessons/lesson-thread";
import { RefreshButton } from "@/components/messages/refresh-button";
import { LoadingState } from "@/components/ui/loading-state";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string; beforeId?: string; receiptsPage?: string }> };
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
  const guide = lessonGuide({ id, status:row.status, isTutor, booking:booking.data, payment:payment.data, now, ownConfirmed:!!ownConfirmation });
  return <article className="mx-auto max-w-3xl space-y-6">
    <Link href="/exchanges?view=paid" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to My learning</Link>
    <header className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="page-heading">{row.skill_name} lesson</h1><RefreshButton /></div><p>With {pickOne(isTutor ? row.learner : row.tutor)?.display_name ?? "Student"}</p><p className="font-semibold">{formatPhp(row.agreed_price_centavos ?? row.quoted_price_centavos)} / one-hour lesson {row.accepted_at ? "(agreed fee)" : "(quoted fee)"}</p></header>
    <section id="meeting" className="scroll-mt-6 space-y-4 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Your next step</h2>
      <p>{guide.text}</p>{guide.href.includes("#") && !guide.href.endsWith("#meeting") && <Link href={guide.href} className="inline-flex min-h-11 items-center font-medium text-primary underline">{guide.label}</Link>}
      <dl className="grid gap-3 sm:grid-cols-3"><div><dt className="text-sm text-muted-foreground">Request</dt><dd>{row.status}</dd></div><div><dt className="text-sm text-muted-foreground">Meeting</dt><dd>{booking.data?.status ?? "Not reserved"}</dd></div><div><dt className="text-sm text-muted-foreground">Payment</dt><dd>{paymentLabels[payment.data?.status ?? "not_requested"] ?? "Not requested"}</dd></div></dl>
      {booking.data && <p>{formatDateTime(booking.data.starts_at)} - {booking.data.format === "online" ? "Online" : "In person"}: <span className="break-words">{booking.data.venue}</span></p>}
      {booking.data?.status === "reserved" && started && <p role="alert">This unpaid reservation has passed and needs resolution. It is not a completed meeting. Cancel it, or arrange a new shared time when scheduling is available.</p>}
      <div className="flex flex-wrap gap-3">{row.status === "pending" && isTutor && <><LessonAction id={id} action="accept" price={row.quoted_price_centavos} label={`Accept at ${formatPhp(row.quoted_price_centavos)}`} /><LessonAction id={id} action="decline" label="Decline request" /></>}{canComplete && <LessonAction id={id} action="complete" label="Confirm lesson completed" />}</div>
      <p className="text-sm text-muted-foreground">Cancellation releases the reserved hour. If money was sent, arrange refunds directly; MMXchange does not issue or guarantee refunds.</p>
    </section>
    {PAID_BOOKING_READY && row.status === "accepted" && (!started || booking.data?.status === "reserved") && <section id="schedule" className="scroll-mt-6"><details className="disclosure" open={!booking.data || !!started}><summary>{booking.data ? "Reschedule shared time" : "Reserve a shared hour"}</summary><Link href="/profile#availability" className="inline-flex min-h-11 items-center text-sm text-primary underline">Set availability</Link><PaidBookingForm id={id} now={now} booking={booking.data} /></details></section>}
    {row.accepted_at && <Suspense fallback={<LoadingState label="Loading private payment details…" />}><PaymentPanel id={id} page={(await searchParams).receiptsPage} /></Suspense>}
    <details className="disclosure" open={row.status === "pending" && isTutor}><summary>Learning goals</summary><p className="whitespace-pre-wrap break-words pb-4">{row.message}</p></details>
    <details className="disclosure"><summary>Conversation</summary><section id="conversation" className="space-y-4"><Suspense fallback={<LoadingState label="Loading lesson messages..." />}><LessonThread id={id} userId={user.id} accepted={!!row.accepted_at} open={row.status === "accepted"} cursor={await searchParams} /></Suspense></section></details>
    {canCancel && <details className="disclosure"><summary>Cancel this lesson</summary><p className="pb-3 text-sm text-muted-foreground">Cancellation releases the reserved hour. If money was sent, arrange any refund directly with your learning partner.</p><LessonAction id={id} action="cancel" label="Cancel request" /></details>}
    {row.status === "completed" && <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">Lesson feedback</h2>{review.data ? <><p>{review.data.rating} / 5</p><p className="whitespace-pre-wrap break-words">{review.data.comment}</p></> : !isTutor ? <LessonComposer id={id} kind="review" /> : <p>The learner has not submitted feedback yet.</p>}</section>}
  </article>;
}
export default function LessonPage(props: Props) { return <Suspense fallback={<LoadingState label="Loading paid lesson..." />}><LessonLoader {...props} /></Suspense>; }
