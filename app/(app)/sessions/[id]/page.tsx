import { LoadingState } from "@/components/ui/loading-state";
import { Announcements } from "@/components/sessions/announcements";
import { SessionFeedback } from "@/components/feedback/session-feedback";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { loadSessionDetail } from "@/lib/session-detail";
import { getSessionDisplayStatus } from "@/lib/group-sessions";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { SessionOrganizerAction } from "@/components/sessions/session-organizer-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegistrationPanel, type PanelKind } from "@/components/sessions/registration-panel";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ announcementBefore?: string; announcementBeforeId?: string }> };

async function SessionDetail({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const cursor = z.object({ announcementBefore: z.iso.datetime({ offset: true }), announcementBeforeId: z.string().uuid() }).safeParse(query);
  if ((query.announcementBefore || query.announcementBeforeId) && !cursor.success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let detail: Awaited<ReturnType<typeof loadSessionDetail>>;
  try { detail = await loadSessionDetail(supabase, id, user.id); }
  catch { return <p role="alert" className="text-destructive">Could not load this session or registration counts. Please reload to try again.</p>; }
  if (!detail) notFound();
  const { session, registered, isRegistered, participants, participantsError, now } = detail;
  const isOrganizer = user.id === session.organizer_id;

  const started = new Date(session.starts_at).getTime() <= now;
  const deadlinePassed =
    !!session.registration_deadline && new Date(session.registration_deadline).getTime() <= now;
  const full = session.capacity !== null && registered >= session.capacity;

  let panel: PanelKind;
  if (session.status === "cancelled") panel = "cancelled";
  else if (session.status === "completed") panel = "completed";
  else if (isRegistered) panel = "registered";
  else if (started || deadlinePassed) panel = "closed";
  else if (full) panel = "full";
  else panel = "open";

  const skillName = pickOne<{ name: string }>(session.skills)?.name;
  const organizerName = pickOne<{ display_name: string }>(session.organizer)?.display_name;

  const seatsText =
    session.capacity === null
      ? `No participant limit (${registered} registered)`
      : `${Math.max(session.capacity - registered, 0)} of ${session.capacity} seats left`;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {skillName && <Badge variant="secondary">{skillName}</Badge>}
          <SessionStatusBadge status={getSessionDisplayStatus(session, registered, now, isRegistered)} />
          {isOrganizer && <Badge variant="outline">Your session</Badge>}
        </div>
        <h1 className="page-heading break-words">{session.title}</h1>
        <p className="text-muted-foreground">Hosted by {organizerName ?? "a student"}</p>
      </header>
      {isOrganizer && session.status === "published" && <Button asChild className="min-h-11"><Link href={`/sessions/${id}/edit`}>Edit session</Link></Button>}

      {!isOrganizer && (
        <RegistrationPanel sessionId={session.id} panel={panel} canCancel={!started} />
      )}

      <dl className="grid gap-4 surface-card p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">When</dt>
          <dd className="font-medium">{formatDateTime(session.starts_at)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Duration</dt>
          <dd className="font-medium">{session.duration_minutes} minutes</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Format</dt>
          <dd className="font-medium">{session.format === "online" ? "Online" : "In person"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">
            {session.format === "online" ? "Meeting details" : "Venue"}
          </dt>
          <dd className="font-medium">{session.venue}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Seats</dt>
          <dd className="font-medium">{seatsText}</dd>
        </div>
        {session.registration_deadline && (
          <div>
            <dt className="text-sm text-muted-foreground">Register by</dt>
            <dd className="font-medium">{formatDateTime(session.registration_deadline)}</dd>
          </div>
        )}
      </dl>

      <section>
        <h2 className="text-lg font-semibold">About this session</h2>
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{session.description}</p>
      </section>

      {session.objectives && (
        <section>
          <h2 className="text-lg font-semibold">What you&apos;ll learn</h2>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{session.objectives}</p>
        </section>
      )}

      {session.prerequisites && (
        <section>
          <h2 className="text-lg font-semibold">Requirements</h2>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{session.prerequisites}</p>
        </section>
      )}

      {isOrganizer && (
        <section className="space-y-3 surface-card p-5">
          <h2 className="text-lg font-semibold">Registered students ({registered})</h2>
          {participantsError ? <p role="alert" className="text-destructive">Could not load the participant list. Please reload to try again.</p> : participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has registered yet.</p>
          ) : (
            <ul className="divide-y">
              {participants.map((p) => (
                <li key={p.id} className="py-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  {p.program && <span className="text-muted-foreground"> · {p.program}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(isOrganizer || isRegistered) && <Suspense fallback={<LoadingState label="Loading announcements…" />}><Announcements sessionId={id} organizer={isOrganizer} published={session.status === "published"} before={cursor.success ? cursor.data.announcementBefore : undefined} beforeId={cursor.success ? cursor.data.announcementBeforeId : undefined} /></Suspense>}
      {session.status === "completed" && <Suspense fallback={<LoadingState label="Loading session feedback…" />}><SessionFeedback sessionId={id} userId={user.id} eligible={isRegistered && !isOrganizer} /></Suspense>}

      {isOrganizer && session.status === "published" && (
        <div className="space-y-4">
          {started && <SessionOrganizerAction sessionId={id} type="complete" />}
          <SessionOrganizerAction sessionId={id} type="cancel" />
        </div>
      )}
    </article>
  );
}

export default function SessionDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading session..." />}>
      <SessionDetail {...props} />
    </Suspense>
  );
}
