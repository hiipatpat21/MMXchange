"use client";
import { useActionState, useId } from "react";
import { uploadPaymentImage, changeLessonPayment } from "@/app/(app)/lessons/payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LessonState } from "@/lib/paid-lessons";
import { PAYMENT_IMAGE_LIMIT } from "@/lib/lesson-payments";

function Result({ state }: { state: LessonState }) {
  return <>{state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}</>;
}
export function PaymentUploadForm({ kind, id, instructions = "" }: { kind: "qr" | "receipt"; id?: string; instructions?: string }) {
  const [state, action, pending] = useActionState(uploadPaymentImage, null);
  const field = useId();
  return <form action={action} className="space-y-4">
    <input type="hidden" name="kind" value={kind} />{id && <input type="hidden" name="id" value={id} />}
    <div className="space-y-2"><Label htmlFor={`${field}-image`}>{kind === "qr" ? "GCash QR image" : "Receipt image"}</Label><Input id={`${field}-image`} name="image" type="file" accept="image/jpeg,image/png,image/webp" required aria-describedby={`${field}-help`} onChange={({ currentTarget }) => { const file = currentTarget.files?.[0]; currentTarget.setCustomValidity(file && file.size > PAYMENT_IMAGE_LIMIT ? "Choose an image up to 2 MB." : ""); currentTarget.reportValidity(); }} /><p id={`${field}-help`} className="text-sm text-muted-foreground">JPG, PNG or WebP, up to 2 MB. Hide unrelated personal details before uploading.</p></div>
    {kind === "qr" && <div className="space-y-2"><Label htmlFor={`${field}-instructions`}>Payment instructions (optional)</Label><textarea id={`${field}-instructions`} name="instructions" maxLength={500} defaultValue={instructions} className="min-h-24 w-full rounded-xl border bg-card p-3" /></div>}
    <Button disabled={pending}>{pending ? "Uploading…" : kind === "qr" ? "Save payment method" : "Submit receipt for review"}</Button><Result state={state} />
  </form>;
}
export function PaymentDecision({ id, receipt, command }: { id: string; receipt?: string; command: "prepare" | "confirm" | "reject" }) {
  const [state, action, pending] = useActionState(changeLessonPayment, null);
  const field = useId();
  return <form action={action} className="space-y-3">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="command" value={command} />{receipt && <input type="hidden" name="receipt" value={receipt} />}
    {command === "confirm" && <p className="text-sm">Confirm only after checking that the agreed fee arrived in your own GCash account.</p>}
    {command === "reject" && <div className="space-y-2"><Label htmlFor={field}>Why does the receipt need replacing?</Label><textarea id={field} name="reason" required minLength={5} maxLength={300} className="min-h-24 w-full rounded-xl border bg-card p-3" /></div>}
    <Button variant={command === "reject" ? "outline" : "default"} disabled={pending}>{pending ? "Saving…" : command === "prepare" ? "Show payment instructions" : command === "confirm" ? "Mark payment received" : "Reject receipt"}</Button><Result state={state} />
  </form>;
}
