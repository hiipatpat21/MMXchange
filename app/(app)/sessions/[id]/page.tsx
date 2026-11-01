import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { cancelSession } from "@/app/(app)/sessions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegistrationPanel, type PanelKind } from "@/components/sessions/registration-panel";

async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("group_sessions")
    .select("*, skills(name), profiles(display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const [{ data: counts }, { data: mine }] = await Promise.all([
    supabase.rpc("registration_counts", { p_session_ids: [id] }),
    supabase
      .from("group_session_registrations")
      .select("session_id")
      .eq("session_id", id)
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const registered = Number(counts?.[0]?.registered ?? 0);
  const isRegistered = !!mine;
  const isOrganizer = user.id === session.organizer_id;

  const now = Date.now();
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

  let participants: { name: string; program: string | null }[] = [];
  if (isOrganizer) {
    const { data } = await supabase
      .from("group_session_registrations")
      .select("created_at, profiles(display_name, program)")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    participants = (data ?? []).map((r) => {
      const p = pickOne<{ display_name: string; program: string | null }>(r.profiles);
      return { name: p?.display_name ?? "Student", program: p?.program ?? null };
    });
  }

  const skillName = pickOne<{ name: string }>(session.skills)?.name;
  const organizerName = pickOne<{ display_name: string }>(session.profiles)?.display_name;

  const seatsText =
    session.capacity === null
      ? `No participant limit (${registered} registered)`
      : `${Math.max(session.capacity - registered, 0)} of ${session.capacity} seats left`;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {skillName && <Badge variant="secondary">{skillName}</Badge>}
          {session.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
          {session.status === "completed" && <Badge>Completed</Badge>}
          {isOrganizer && <Badge variant="outline">Your session</Badge>}
        </div>
        <h1 className="text-3xl font-bold">{session.title}</h1>
        <p className="text-muted-foreground">Hosted by {organizerName ?? "a student"}</p>
      </header>

      {!isOrganizer && (
        <RegistrationPanel sessionId={session.id} panel={panel} canCancel={!started} />
      )}

      <dl className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
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
          <h2 className="text-lg font-semibold">What you'll learn</h2>
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
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Registered students ({participants.length})</h2>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has registered yet.</p>
          ) : (
            <ul className="divide-y">
              {participants.map((p, i) => (
                <li key={i} className="py-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  {p.program && <span className="text-muted-foreground"> · {p.program}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isOrganizer && session.status === "published" && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-medium text-destructive">
            Cancel this session
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">
            Registered students will see the session marked as cancelled. This can't be undone.
          </p>
          <form action={cancelSession} className="mt-3">
            <input type="hidden" name="sessionId" value={session.id} />
            <Button type="submit" variant="destructive">
              Yes, cancel this session
            </Button>
          </form>
        </details>
      )}
    </article>
  );
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading session...</p>}>
      <SessionDetail params={params} />
    </Suspense>
  );
}