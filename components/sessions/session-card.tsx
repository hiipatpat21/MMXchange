import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/datetime";
import type { SessionCardData } from "@/lib/group-sessions";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";

export type { SessionCardData } from "@/lib/group-sessions";

export function SessionCard({ session, registrationBadge }: { session: SessionCardData; registrationBadge?: string }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block min-w-0 break-words surface-card p-5 transition-shadow hover:border-primary/25 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex flex-wrap gap-2">
        {session.skillName && <Badge variant="secondary" className="h-auto max-w-full whitespace-normal py-1">{session.skillName}</Badge>}
        <SessionStatusBadge status={session.displayStatus} />
        {registrationBadge && registrationBadge !== session.displayStatus && <Badge variant="outline" className="h-auto whitespace-normal py-1">{registrationBadge}</Badge>}
      </div>
      <h3 className="mt-3 text-lg font-semibold">{session.title}</h3>
      <p className="text-sm text-muted-foreground">
        Hosted by {session.organizerName ?? "a student"}
      </p>
      <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          <dd>{formatDateTime(session.starts_at)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          <dd>{session.format === "online" ? "Online" : "In person"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4" />
          <dd>
            {session.capacity === null
              ? `${session.registered} registered · No participant limit`
              : session.registered >= session.capacity
                ? `${session.registered} / ${session.capacity} registered · Full`
                : `${session.registered} / ${session.capacity} registered · ${session.capacity - session.registered} seats left`}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
