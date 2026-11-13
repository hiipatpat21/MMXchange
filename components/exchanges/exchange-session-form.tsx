"use client";

import { useActionState, useState } from "react";
import { scheduleSession, rescheduleSession } from "@/app/(app)/exchanges/actions";
import type { ExchangeSession, ExchangeTeacher } from "@/lib/exchanges";
import { SharedSlotPicker } from "@/components/availability/shared-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { meetingUrlHint } from "@/lib/meeting-links";

const selectClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-base sm:text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function ExchangeSessionForm({ exchangeId, teachers, session, now }: { exchangeId: string; teachers: ExchangeTeacher[]; session?: ExchangeSession; now: number }) {
  const [state, action, pending] = useActionState(session ? rescheduleSession : scheduleSession, null);
  const prefix = session?.id ?? "new-session";
  const [format, setFormat] = useState(session?.format ?? "in_person");

  return (
    <form action={action} className="space-y-4 pt-4">
      <input type="hidden" name={session ? "sessionId" : "exchangeId"} value={session?.id ?? exchangeId} />
      {!session && <div className="space-y-2">
        <Label htmlFor={`${prefix}-teacher`}>Who teaches?</Label>
        <select id={`${prefix}-teacher`} name="teacherId" defaultValue="" required className={selectClass}>
          <option value="" disabled>Choose a teacher</option>
          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} teaches {teacher.skillName}</option>)}
        </select>
      </div>}
      <input type="hidden" name="duration" value="60" />
      {session && session.duration_minutes !== 60 && <p className="text-sm">This existing meeting is {session.duration_minutes} minutes. Rescheduling changes it to one hour.</p>}
      <SharedSlotPicker kind="exchange" id={exchangeId} exclude={session?.id} now={now} />
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`${prefix}-format`}>Format</Label>
        <select id={`${prefix}-format`} name="format" defaultValue={session?.format ?? "in_person"} onChange={event => setFormat(event.target.value === "online" ? "online" : "in_person")} required className={selectClass}>
          <option value="in_person">In person</option><option value="online">Online</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-venue`}>{format === "online" ? "Online meeting URL" : "In-person venue"}</Label>
        <Input id={`${prefix}-venue`} name="venue" type={format === "online" ? "url" : "text"} minLength={2} maxLength={200} required defaultValue={session?.venue ?? ""} placeholder={format === "online" ? "https://meet.example.com/your-meeting" : "Public meeting place"} aria-describedby={`${prefix}-venue-hint`} className="h-10" />
        <p id={`${prefix}-venue-hint`} className="text-sm text-muted-foreground">{format === "online" ? meetingUrlHint : "Choose a public, easy-to-find place."}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-notes`}>What to prepare (optional)</Label>
        <Textarea id={`${prefix}-notes`} name="notes" rows={3} maxLength={500} defaultValue={session?.notes ?? ""} />
      </div>
      <p className="text-sm text-muted-foreground">Changing sessions clears both students&apos; completion confirmations.</p>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
      <Button type="submit" disabled={pending} className="min-h-11">{pending ? "Saving..." : session ? "Confirm reschedule" : "Schedule session"}</Button>
    </form>
  );
}
