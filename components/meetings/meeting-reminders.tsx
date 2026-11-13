"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getMeetingReminders } from "@/app/(app)/reminders/actions";
import { startMeetingReminders } from "@/lib/reminder-browser";
import { reminderCountdown, reminderOccurrence, type ReminderSnapshot } from "@/lib/meeting-reminders";
import { formatDateTime } from "@/lib/datetime";
import { MeetingLocation } from "@/components/meetings/meeting-location";
import { Button } from "@/components/ui/button";

export function MeetingReminders({ userId }: { userId: string }) {
  const [snapshot,setSnapshot]=useState<ReminderSnapshot>({meetings:[],now:0});
  const [announcement,setAnnouncement]=useState("");
  const controller=useRef<ReturnType<typeof startMeetingReminders> | null>(null);
  useEffect(()=>{
    const active=startMeetingReminders(userId,getMeetingReminders,setSnapshot,setAnnouncement);
    controller.current=active;
    return ()=>{active.stop();controller.current=null;};
  },[userId]);
  return <MeetingReminderBanner snapshot={snapshot} announcement={announcement} onDismiss={row=>controller.current?.dismiss(row)} />;
}

export function MeetingReminderBanner({snapshot,announcement,onDismiss}: {
  snapshot: ReminderSnapshot; announcement: string; onDismiss: (row: ReminderSnapshot["meetings"][number]) => void;
}) {
  return <>
    <p role="alert" aria-atomic="true" className="sr-only">{announcement}</p>
    {snapshot.error && <p role="status" className="mx-auto mb-6 max-w-3xl rounded-xl border bg-card p-4 text-sm">{snapshot.error} <Link href="/dashboard" className="text-primary underline">Open Home</Link></p>}
    {!!snapshot.meetings.length && <section aria-label="Meeting reminders" className="mx-auto mb-6 max-w-3xl space-y-3 rounded-xl border border-primary/25 bg-secondary p-4 sm:p-5">
      <h2 className="text-lg font-semibold">Meeting reminders</h2>
      <ul className="divide-y">{snapshot.meetings.map(row=><li key={reminderOccurrence(row)} className="space-y-2 py-3 first:pt-0 last:pb-0">
        <div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words font-semibold">{row.title}</h3><Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={`Dismiss reminder for ${row.title}`} onClick={()=>onDismiss(row)}><X aria-hidden="true" className="size-4" /></Button></div>
        <p className="text-sm">{formatDateTime(row.startsAt)} · Philippine time</p>
        <p aria-live="off" className="text-sm font-medium tabular-nums">{reminderCountdown(row.startsAt,snapshot.now)}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Link href={row.href} className="inline-flex min-h-11 items-center text-sm text-primary underline">View meeting details</Link><MeetingLocation format={row.format} venue={row.venue} state="confirmed" editHref={row.href} /></div>
      </li>)}</ul>
      <p className="text-xs text-muted-foreground">Reminders refresh while this app is open and visible. They may arrive late after sleep or a lost connection.</p>
    </section>}
  </>;
}
