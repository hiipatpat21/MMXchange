import Link from "next/link";
import { parseMeetingUrl } from "@/lib/meeting-links";

// Render only inside a participant-authorized loader. This component does not load data.
export function MeetingLocation({ format, venue, state, editHref }: {
  format: string; venue: string; state: "confirmed" | "reserved" | "closed"; editHref?: string;
}) {
  if (format !== "online") return <p className="whitespace-pre-line break-words">{venue}</p>;
  const url = parseMeetingUrl(venue);
  if (!url) return <div className="space-y-2">
    <p className="whitespace-pre-line break-words">{venue}</p>
    <p className="text-sm text-muted-foreground">This meeting link needs updating. {editHref
      ? <Link href={editHref} className="inline-flex min-h-11 items-center text-primary underline">Update the meeting details</Link>
      : "Ask your learning partner to arrange a valid meeting link."}</p>
  </div>;
  if (state === "reserved") return <p className="text-sm text-muted-foreground">Online joining becomes available after the tutor confirms payment. This is still a reservation.</p>;
  if (state === "closed") return <p className="break-words text-sm text-muted-foreground">{venue}</p>;
  return <a href={url.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full flex-wrap items-center gap-x-2 rounded-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Open meeting link on ${url.host} (opens in a new tab)`}>
    <span className="font-medium">Open meeting link</span><span className="break-all text-sm">({url.host})</span>
  </a>;
}
