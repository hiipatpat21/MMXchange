"use client";
import { useActionState } from "react";
import { requestPaidLesson } from "@/app/(app)/lessons/actions";
import { formatPhp } from "@/lib/paid-lessons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function PaidRequestForm({ offer, price }: { offer: string; price: number }) {
  const [state, action, pending] = useActionState(requestPaidLesson, null);
  return <form action={action} className="space-y-4 rounded-xl border bg-card p-5"><input type="hidden" name="offer" value={offer} /><input type="hidden" name="price" value={price} />
    <p className="font-semibold">{formatPhp(price)} per one-hour lesson</p><p className="text-sm">The tutor must accept this quoted fee. Acceptance does not mean a meeting is reserved or payment is confirmed.</p>
    <Label htmlFor="lesson-message">What would you like to learn?</Label><Textarea id="lesson-message" name="message" minLength={10} maxLength={500} required />
    {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}<Button disabled={pending}>{pending ? "Sending..." : "Request paid lesson"}</Button>
  </form>;
}
