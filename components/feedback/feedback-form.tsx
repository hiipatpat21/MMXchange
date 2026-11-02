"use client";

import { useActionState, useId } from "react";
import { Star } from "lucide-react";
import { submitExchangeReview, submitSessionFeedback } from "@/app/(app)/feedback/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackForm({ id, session = false }: { id: string; session?: boolean }) {
  const [state, action, pending] = useActionState(session ? submitSessionFeedback : submitExchangeReview, null);
  const formId = useId();
  if (state?.message) return <p role="status" className="text-sm text-primary">{state.message}</p>;
  return <form action={action} className="space-y-4">
    <input type="hidden" name="id" value={id} />
    <fieldset disabled={pending} className="space-y-3"><legend className="text-sm font-medium">Your rating (required)</legend>
      <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(rating => <div key={rating}>
        <input className="peer sr-only" type="radio" id={`${formId}-${rating}`} name="rating" value={rating} required />
        <Label htmlFor={`${formId}-${rating}`} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-xl border px-3 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"><span>{rating}</span><Star aria-hidden="true" className="size-4" /><span className="sr-only">{rating === 1 ? "star" : "stars"}</span></Label>
      </div>)}</div>
    </fieldset>
    {session && <fieldset disabled={pending}><legend className="text-sm font-medium">Was this session helpful? (required)</legend><div className="flex flex-wrap gap-4">{["yes", "no"].map(value => <Label key={value} htmlFor={`${formId}-${value}`} className="flex min-h-11 cursor-pointer items-center gap-2"><input id={`${formId}-${value}`} type="radio" name="helpful" value={value} required className="size-4 accent-primary" />{value === "yes" ? "Yes" : "No"}</Label>)}</div></fieldset>}
    <div className="space-y-2"><Label htmlFor={`${formId}-comment`}>Comment (optional, up to 500 characters)</Label><Textarea id={`${formId}-comment`} name="comment" maxLength={500} rows={3} disabled={pending} placeholder="Share what helped you learn…" /><p className="text-xs text-muted-foreground">Your rating and comment will be visible to logged-in students. Submit once; feedback cannot be edited.</p></div>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit feedback"}</Button>
  </form>;
}
