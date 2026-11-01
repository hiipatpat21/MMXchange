import Link from "next/link";
import type { ExchangeSession, ExchangeTeacher } from "@/lib/exchanges";
import { formatDateTime } from "@/lib/datetime";
import { StatusBadge } from "@/components/exchanges/status-badge";
import { ExchangeSessionForm } from "@/components/exchanges/exchange-session-form";
import { ExchangeSessionAction } from "@/components/exchanges/exchange-session-action";

export function ExchangeSessionList({ exchangeId, sessions, teachers, editable }: { exchangeId: string; sessions: ExchangeSession[]; teachers: ExchangeTeacher[]; editable: boolean }) {
  return (
    <section className="space-y-4" aria-labelledby="sessions-heading">
      <h2 id="sessions-heading" className="text-lg font-semibold">Sessions</h2>
      {!sessions.length && <div className="space-y-2 rounded-xl border border-dashed p-5"><p>No teaching sessions scheduled yet.</p>{editable ? <p className="text-sm text-muted-foreground">Use the form below to schedule your first session.</p> : <Link href="/exchanges" className="text-sm text-primary underline">Back to your exchanges</Link>}</div>}
      <ul className="space-y-4">
        {sessions.map((session) => {
          const teacher = teachers.find((person) => person.id === session.teacher_id);
          return <li key={session.id} className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-semibold">{teacher?.name ?? "Student"} teaches {teacher?.skillName ?? "the agreed skill"}</h3><StatusBadge status={session.status} /></div>
            <dl className="space-y-2 break-words text-sm">
              <div><dt className="text-muted-foreground">When</dt><dd>{formatDateTime(session.starts_at)} · {session.duration_minutes} minutes</dd></div>
              <div><dt className="text-muted-foreground">{session.format === "online" ? "Online meeting" : "In-person venue"}</dt><dd className="whitespace-pre-line">{session.venue}</dd></div>
              <div><dt className="text-muted-foreground">What to prepare</dt><dd className="whitespace-pre-line">{session.notes || "No preparation notes provided."}</dd></div>
            </dl>
            {editable && session.status === "scheduled" && <>
              <details className="rounded-lg border p-3"><summary className="min-h-10 cursor-pointer py-2 text-sm font-medium">Reschedule session</summary><ExchangeSessionForm exchangeId={exchangeId} teachers={teachers} session={session} /></details>
              <ExchangeSessionAction id={session.id} type="cancel" />
            </>}
          </li>;
        })}
      </ul>
      {editable && <details id="schedule-session" className="rounded-xl border bg-card p-5" open={!sessions.some((session) => session.status === "scheduled")}>
        <summary className="min-h-10 cursor-pointer py-2 font-medium">Schedule a session</summary>
        <ExchangeSessionForm exchangeId={exchangeId} teachers={teachers} />
      </details>}
    </section>
  );
}
