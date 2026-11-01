"use client";

import { useActionState, useState } from "react";
import { createSession } from "@/app/(app)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Skill = { id: number; name: string };

const selectClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";

export function SessionForm({ skills }: { skills: Skill[] }) {
  const [state, formAction, pending] = useActionState(createSession, null);
  const [format, setFormat] = useState("in_person");

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="title">Session title</Label>
        <Input id="title" name="title" placeholder="Introduction to Python for Beginners" maxLength={100} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillId">Skill or topic</Label>
        <select id="skillId" name="skillId" required defaultValue="" className={selectClass}>
          <option value="" disabled>Choose a skill</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} maxLength={1000} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="objectives">What will attendees learn? (optional)</Label>
        <Textarea id="objectives" name="objectives" rows={3} maxLength={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Date and start time (Philippine time)</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration</Label>
          <select id="durationMinutes" name="durationMinutes" defaultValue="60" className={selectClass}>
            {[30, 60, 90, 120, 180].map((m) => (
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
            onChange={(e) => setFormat(e.target.value)}
            className={selectClass}
          >
            <option value="in_person">In person</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Participant limit (optional)</Label>
          <Input id="capacity" name="capacity" type="number" min={1} max={500} placeholder="Leave empty for no limit" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">
          {format === "in_person" ? "Venue" : "Meeting link or instructions"}
        </Label>
        <Input id="venue" name="venue" maxLength={200} required />
        {format === "in_person" && (
          <p className="text-xs text-muted-foreground">
            Suggest a public, easy-to-find place for everyone's safety.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Registration deadline (optional)</Label>
        <Input id="deadline" name="deadline" type="datetime-local" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Requirements or things to bring (optional)</Label>
        <Textarea id="prerequisites" name="prerequisites" rows={2} maxLength={500} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Publish session"}
      </Button>
    </form>
  );
}