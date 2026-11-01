"use client";

import { useActionState } from "react";
import { scheduleSession, rescheduleSession } from "@/app/(app)/exchanges/actions";
import type { ExchangeSession, ExchangeTeacher } from "@/lib/exchanges";
import { formatManilaInput } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function ExchangeSessionForm({ exchangeId, teachers, session }: { exchangeId: string; teachers: ExchangeTeacher[]; session?: ExchangeSession }) {
  const [state, action, pending] = useActionState(session ? rescheduleSession : scheduleSession, null);
  const prefix = session?.id ?? "new-session";
  const durations = [...new Set([15, 30, 45, 60, 90, 120, 180, 240, 360, 480, session?.duration_minutes ?? 60])].sort((a, b) => a - b);
  return (
    <form action={action} className="space-y-4 pt-4">
      <input type="hidden" name={session ? "sessionId" : "exchangeId"} value={session?.id ?? exchangeId} />
      {!session && <div className="space-y-2">
        <Label htmlFor={`${prefix}-teacher`}>Who teaches?</Label>
        <select id={`${prefix}-teacher`} name="teacherId" defaultValue="" required className={selectClass}>
          <option value="" disabled>Choose a teacher and their agreed skill</option>
          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} teaches {teacher.skillName}</option>)}
        </select>
      </div>}
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-starts`}>Date and time (Philippine time, UTC+8)</Label>
        <Input id={`${prefix}-starts`} name="startsAt" type="datetime-local" required defaultValue={session ? formatManilaInput(session.starts_at) : ""} className="h-10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${prefix}-duration`}>Duration</Label>
          <select id={`${prefix}-duration`} name="duration" defaultValue={session?.duration_minutes ?? 60} required className={selectClass}>
            {durations.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${prefix}-format`}>Format</Label>
          <select id={`${prefix}-format`} name="format" defaultValue={session?.format ?? "in_person"} required className={selectClass}>
            <option value="in_person">In person</option><option value="online">Online</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-venue`}>Venue or meeting link</Label>
        <Input id={`${prefix}-venue`} name="venue" minLength={2} maxLength={200} required defaultValue={session?.venue ?? ""} aria-describedby={`${prefix}-venue-hint`} className="h-10" />
        <p id={`${prefix}-venue-hint`} className="text-sm text-muted-foreground">For in-person sessions, choose a public, easy-to-find place.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-notes`}>What to prepare (optional)</Label>
        <Textarea id={`${prefix}-notes`} name="notes" rows={3} maxLength={500} defaultValue={session?.notes ?? ""} />
      </div>
      <p className="text-sm text-muted-foreground">Changing sessions clears both students&apos; completion confirmations.</p>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
      <Button type="submit" disabled={pending} className="min-h-10">{pending ? "Saving..." : session ? "Confirm reschedule" : "Schedule session"}</Button>
    </form>
  );
}
