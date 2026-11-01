import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/datetime";

export type SessionCardData = {
  id: string;
  title: string;
  starts_at: string;
  format: string;
  capacity: number | null;
  skillName: string | null;
  organizerName: string | null;
  registered: number;
};

export function SessionCard({ session }: { session: SessionCardData }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-xl border bg-card p-5 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      {session.skillName && <Badge variant="secondary">{session.skillName}</Badge>}
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
              ? "No participant limit"
              : session.registered >= session.capacity
                ? "Full"
                : `${session.capacity - session.registered} of ${session.capacity} seats left`}
          </dd>
        </div>
      </dl>
    </Link>
  );
}