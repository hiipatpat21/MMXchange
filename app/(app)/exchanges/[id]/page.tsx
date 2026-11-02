import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { canMessage } from "@/lib/messages";
import { ExchangeFeedback } from "@/components/feedback/exchange-feedback";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exchangeFormats, exchangePerspective, type ExchangeDetail as ExchangeDetailData } from "@/lib/exchanges";
import { loadExchangeSessions, getExchangeProgress } from "@/lib/exchange-sessions";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { StatusBadge } from "@/components/exchanges/status-badge";
import { ExchangeResponse } from "@/components/exchanges/exchange-response";
import { ExchangeProgress } from "@/components/exchanges/exchange-progress";
import { ExchangeSessionList } from "@/components/exchanges/exchange-session-list";
import { ExchangeSessionAction } from "@/components/exchanges/exchange-session-action";

async function ExchangeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data, error } = await supabase.from("exchange_requests")
    .select("id, requester_id, recipient_id, status, created_at, message, format, availability, notes, teach_skill_id, learn_skill_id, requester_completed_at, recipient_completed_at, requester:profiles!requester_id(display_name), recipient:profiles!recipient_id(display_name), learn_skill:skills!learn_skill_id(name), teach_skill:skills!teach_skill_id(name)")
    .eq("id", id).maybeSingle();
  if (error) return <p role="alert" className="text-destructive">Could not load this exchange. Please reload to try again.</p>;
  if (!data) notFound();
  const exchange = data as ExchangeDetailData;
  // RLS already hides the row from non-participants; keep this explicit too.
  if (user.id !== exchange.requester_id && user.id !== exchange.recipient_id) notFound();
  const view = exchangePerspective(exchange, user.id);
  const isRequester = exchange.requester_id === user.id;
  const canRespond = !isRequester && exchange.status === "pending";
  const editable = exchange.status === "accepted" || exchange.status === "scheduled";
  const canCancel = (isRequester && exchange.status === "pending") || editable;
  const { sessions, error: sessionsError, now } = await loadExchangeSessions(supabase, id);
  let feedbackSubmitted: boolean | null = false;
  if (exchange.status === "completed") {
    const review = await supabase.from("exchange_reviews").select("id").eq("exchange_id", id).eq("reviewer_id", user.id).maybeSingle();
    feedbackSubmitted = review.error ? null : !!review.data;
  }
  const progress = sessionsError ? null : getExchangeProgress(exchange, sessions, user.id, view.otherName, now, feedbackSubmitted);
  const teachers = [
    { id: exchange.requester_id, name: pickOne(exchange.requester)?.display_name ?? "Student", skillName: pickOne(exchange.teach_skill)?.name ?? "Unknown skill" },
    { id: exchange.recipient_id, name: pickOne(exchange.recipient)?.display_name ?? "Student", skillName: pickOne(exchange.learn_skill)?.name ?? "Unknown skill" },
  ];
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <StatusBadge status={exchange.status} />
        <h1 className="break-words page-heading">Exchange with {view.otherName}</h1>
        <p className="text-sm text-muted-foreground">Requested {formatDateTime(exchange.created_at)}</p>
      </header>
      {canMessage(exchange.status) && <Button asChild variant="outline"><Link href={`/messages/${id}`} className="max-w-full whitespace-normal break-words">Message {view.otherName}</Link></Button>}
      {progress && <ExchangeProgress currentStep={progress.currentStep} nextAction={progress.nextAction} status={exchange.status} />}
      <section className="space-y-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Exchange summary</h2>
        <p className="break-words text-sm">Requested by <Link className="text-primary underline" href={`/students/${exchange.requester_id}`}>{pickOne(exchange.requester)?.display_name ?? "Student"}</Link> for <Link className="text-primary underline" href={`/students/${exchange.recipient_id}`}>{pickOne(exchange.recipient)?.display_name ?? "Student"}</Link>.</p>
        <dl className="space-y-3 break-words">
          <div><dt className="text-sm text-muted-foreground">You teach</dt><dd className="font-medium">{view.youTeach}</dd></div>
          <div><dt className="text-sm text-muted-foreground">They teach</dt><dd className="font-medium">{view.theyTeach}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Preferred format</dt><dd>{exchangeFormats[exchange.format]}</dd></div>
          {progress && <div><dt className="text-sm text-muted-foreground">Next meeting</dt><dd>{progress.nextSession ? `${formatDateTime(progress.nextSession.starts_at)} · ${progress.nextSession.duration_minutes} minutes` : "No upcoming meeting scheduled."}</dd></div>}
        </dl>
        {!sessionsError && <div className="space-y-3">
          <h3 className="text-sm font-semibold">Preparation for your next teaching slots</h3>
          {teachers.map((teacher) => {
            const slot = sessions.find((session) => session.teacher_id === teacher.id && session.status === "scheduled" && Date.parse(session.starts_at) > now);
            return <p key={teacher.id} className="whitespace-pre-line break-words text-sm text-muted-foreground"><span className="font-medium text-foreground">{teacher.name} teaches {teacher.skillName}: </span>{slot ? slot.notes || "No preparation notes provided." : "No upcoming slot in this direction."}</p>;
          })}
        </div>}
      </section>
      <section className="space-y-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Request details</h2>
        <dl className="space-y-4 break-words">
          <div><dt className="font-medium">Message</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.message}</dd></div>
          <div><dt className="font-medium">Availability</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.availability || "Not provided."}</dd></div>
          <div><dt className="font-medium">Learning goals</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.notes || "Not provided."}</dd></div>
        </dl>
      </section>
      {sessionsError ? <p role="alert" className="text-destructive">Could not load sessions. Please reload to try again. On a new setup, run the prompt 3 SQL first.</p> : <ExchangeSessionList exchangeId={id} sessions={sessions} teachers={teachers} editable={editable} />}
      {(exchange.status === "scheduled" || exchange.status === "completed") && <section className="space-y-3 surface-card p-5">
        <h2 className="text-lg font-semibold">Completion confirmations</h2>
        <p className="text-sm text-muted-foreground">Both students must confirm after at least one non-cancelled session has started. Confirm only when you consider the exchange finished.</p>
        <ul className="space-y-2 text-sm">
          {[{ name: teachers[0].name, at: exchange.requester_completed_at }, { name: teachers[1].name, at: exchange.recipient_completed_at }].map((person, index) => <li key={teachers[index].id} className="break-words">{person.name}: {person.at ? `Confirmed ${formatDateTime(person.at)}` : "Not confirmed yet."}</li>)}
        </ul>
        {progress?.canComplete && <ExchangeSessionAction id={id} type="complete" />}
      </section>}
      {(canRespond || canCancel) && <ExchangeResponse exchangeId={id} canRespond={canRespond} />}
      {exchange.status === "completed" && <Suspense fallback={<LoadingState label="Loading feedback…" />}><ExchangeFeedback exchangeId={id} submitted={feedbackSubmitted} /></Suspense>}
      <Link href="/exchanges" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to exchanges</Link>
    </article>
  );
}

export default function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<LoadingState label="Loading exchange..." />}><ExchangeDetail params={params} /></Suspense>;
}
