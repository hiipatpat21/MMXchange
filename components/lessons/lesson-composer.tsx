"use client";
import { useActionState } from "react";
import { submitLessonContent } from "@/app/(app)/lessons/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function LessonComposer({ id, kind }: { id: string; kind: "message" | "review" }) {
  const [state, action, pending] = useActionState(submitLessonContent, null);
  if (kind === "review" && state?.message) return <p role="status">{state.message}</p>;
  return <form action={action} className="space-y-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} />
    {kind === "review" && <div className="space-y-2"><Label htmlFor="lesson-rating">Rating</Label><select id="lesson-rating" name="rating" defaultValue="" required className="h-11 w-full rounded-xl border bg-card px-3"><option value="" disabled>Choose 1-5</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value}</option>)}</select><p className="text-sm">Feedback is private to this lesson&apos;s participants. Submit once; it cannot be edited.</p></div>}
    <Label htmlFor={`lesson-${kind}`}>{kind === "message" ? "Your message" : "Comment (optional)"}</Label><Textarea id={`lesson-${kind}`} name="body" required={kind === "message"} maxLength={kind === "message" ? 2000 : 500} rows={3} />
    <Button disabled={pending}>{pending ? "Sending..." : kind === "message" ? "Send message" : "Submit feedback"}</Button>
    {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}{state?.message && <p role="status">{state.message}</p>}
  </form>;
}
