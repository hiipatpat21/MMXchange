"use client";

import { useActionState } from "react";
import { sendMessage } from "@/app/(app)/messages/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function MessageForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(sendMessage, null);
  const fieldId = "message-body";
  return <form action={action} className="space-y-3">
    <input type="hidden" name="id" value={id} />
    <Label htmlFor={fieldId}>Your message</Label>
    <Textarea id={fieldId} name="body" required maxLength={2000} rows={3} placeholder="Write a message" />
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
  </form>;
}
