"use client";

import { useActionState } from "react";
import { sendMessage, postAnnouncement } from "@/app/(app)/messages/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function MessageForm({ id, announcement = false }: { id: string; announcement?: boolean }) {
  const [state, action, pending] = useActionState(announcement ? postAnnouncement : sendMessage, null);
  const fieldId = announcement ? "announcement-body" : "message-body";
  return <form action={action} className="space-y-3">
    <input type="hidden" name="id" value={id} />
    <Label htmlFor={fieldId}>{announcement ? "Announcement for registered students" : "Your message"}</Label>
    <Textarea id={fieldId} name="body" required maxLength={announcement ? 1000 : 2000} rows={3} placeholder={announcement ? "Share preparation notes or an update…" : "Write a message…"} />
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Sending…" : announcement ? "Post announcement" : "Send message"}</Button>
  </form>;
}
