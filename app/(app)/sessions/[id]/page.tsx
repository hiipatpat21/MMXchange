import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";

async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("group_sessions")
    .select("*, skills(name), profiles(display_name)")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const skillName = pickOne<{ name: string }>(session.skills)?.name;
  const organizerName = pickOne<{ display_name: string }>(session.profiles)?.display_name;
  const isOrganizer = user?.id === session.organizer_id;

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
          <dt className="text-sm text-muted-foreground">Participants</dt>
          <dd className="font-medium">
            {session.capacity ? `Up to ${session.capacity} students` : "No participant limit"}
          </dd>
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