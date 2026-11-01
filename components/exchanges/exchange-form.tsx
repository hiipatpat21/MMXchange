"use client";

import { useActionState } from "react";
import { createExchangeRequest } from "@/app/(app)/exchanges/actions";
import type { ExchangeSkill } from "@/lib/exchanges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function ExchangeForm({ recipientId, recipientName, learnSkills, teachSkills, initialLearn, initialTeach }: {
  recipientId: string;
  recipientName: string;
  learnSkills: ExchangeSkill[];
  teachSkills: ExchangeSkill[];
  initialLearn?: number;
  initialTeach?: number;
}) {
  const [state, formAction, pending] = useActionState(createExchangeRequest, null);
  return (
    <form action={formAction} className="space-y-5 rounded-xl border bg-card p-5">
      <input type="hidden" name="recipientId" value={recipientId} />
      <p className="break-words text-sm text-muted-foreground">Request an exchange with {recipientName}. You each teach one skill.</p>
      <div className="space-y-2">
        <Label htmlFor="learnSkillId">Skill you want to learn</Label>
        <select id="learnSkillId" name="learnSkillId" defaultValue={initialLearn ?? ""} className={selectClass} required>
          <option value="" disabled>Choose a skill they teach</option>
          {learnSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="teachSkillId">Skill you will teach in return</Label>
        <select id="teachSkillId" name="teachSkillId" defaultValue={initialTeach ?? ""} className={selectClass} required>
          <option value="" disabled>Choose a skill you teach</option>
          {teachSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={4} minLength={10} maxLength={500} required aria-describedby="message-hint" />
        <p id="message-hint" className="text-sm text-muted-foreground">Introduce yourself and explain the exchange you have in mind (10–500 characters).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="format">Preferred format</Label>
        <select id="format" name="format" defaultValue="either" className={selectClass} required>
          <option value="in_person">In person</option><option value="online">Online</option><option value="either">Either</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="availability">Availability (optional)</Label>
        <Textarea id="availability" name="availability" rows={2} maxLength={300} placeholder="Days and times that usually work for you" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Learning goals (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} maxLength={500} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="min-h-10">{pending ? "Sending..." : "Send request"}</Button>
    </form>
  );
}
