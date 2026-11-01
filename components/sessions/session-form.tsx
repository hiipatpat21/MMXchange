"use client";

import { useActionState, useState } from "react";
import { createSession } from "@/app/(app)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GroupSession, SessionActionState } from "@/lib/group-sessions";
import { toManilaInput } from "@/lib/datetime";

type Skill = { id: number; name: string };

const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function SessionForm({ skills, initialValues, action = createSession }: { skills: Skill[]; initialValues?: GroupSession; action?: (previous: SessionActionState, formData: FormData) => Promise<SessionActionState> }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [format, setFormat] = useState(initialValues?.format ?? "in_person");

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-6">
      {initialValues && <>
        <input type="hidden" name="sessionId" value={initialValues.id} />
        <p className="text-sm text-muted-foreground">Registered students will be notified of important changes when notifications are added in a later phase.</p>
      </>}
      <div className="space-y-2">
        <Label htmlFor="title">Session title</Label>
        <Input id="title" name="title" defaultValue={initialValues?.title} placeholder="Introduction to Python for Beginners" minLength={3} maxLength={100} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillId">Skill or topic</Label>
        <select id="skillId" name="skillId" required defaultValue={initialValues?.skill_id ?? ""} className={selectClass}>
          <option value="" disabled>Choose a skill</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={initialValues?.description} rows={4} minLength={10} maxLength={1000} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="objectives">What will attendees learn? (optional)</Label>
        <Textarea id="objectives" name="objectives" defaultValue={initialValues?.objectives ?? ""} rows={3} maxLength={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Date and start time (Philippine time)</Label>
          <Input id="startsAt" name="startsAt" defaultValue={initialValues ? toManilaInput(initialValues.starts_at) : ""} type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration</Label>
          <select id="durationMinutes" name="durationMinutes" defaultValue={initialValues?.duration_minutes ?? 60} className={selectClass}>
            {[...new Set([15, 30, 60, 90, 120, 180, 240, 480, initialValues?.duration_minutes ?? 60])].sort((a, b) => a - b).map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="format">Format</Label>
          <select
            id="format"
            name="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as "in_person" | "online")}
            className={selectClass}
          >
            <option value="in_person">In person</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Participant limit (optional)</Label>
          <Input id="capacity" name="capacity" defaultValue={initialValues?.capacity ?? ""} type="number" min={1} max={500} placeholder="Leave empty for no limit" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">
          {format === "in_person" ? "Venue" : "Meeting link or instructions"}
        </Label>
        <Input id="venue" name="venue" defaultValue={initialValues?.venue} minLength={2} maxLength={200} required />
        {format === "in_person" && (
          <p className="text-xs text-muted-foreground">
            Suggest a public, easy-to-find place for everyone&apos;s safety.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Registration deadline (optional, Philippine time)</Label>
        <Input id="deadline" name="deadline" defaultValue={initialValues?.registration_deadline ? toManilaInput(initialValues.registration_deadline) : ""} type="datetime-local" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Requirements or things to bring (optional)</Label>
        <Textarea id="prerequisites" name="prerequisites" defaultValue={initialValues?.prerequisites ?? ""} rows={2} maxLength={500} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="min-h-10">
        {pending ? "Saving..." : initialValues ? "Save changes" : "Publish session"}
      </Button>
    </form>
  );
}
