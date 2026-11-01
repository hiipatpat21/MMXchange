"use client";

import { useActionState } from "react";
import { cancelSession, completeSession } from "@/app/(app)/sessions/actions";
import { Button } from "@/components/ui/button";

export function SessionOrganizerAction({ sessionId, type }: { sessionId: string; type: "cancel" | "complete" }) {
  const [state, action, pending] = useActionState(type === "complete" ? completeSession : cancelSession, null);
  return <form action={action} className="space-y-3 rounded-xl border p-4"><input type="hidden" name="sessionId" value={sessionId} /><details>
    <summary className={`min-h-10 cursor-pointer py-2 text-sm font-medium ${type === "cancel" ? "text-destructive" : "text-primary"}`}>{type === "cancel" ? "Cancel this session" : "Mark session as completed"}</summary>
    <p className="my-3 text-sm text-muted-foreground">{type === "cancel" ? "Registered students will see this session marked as cancelled. This cannot be undone." : "Completing the session lets attendees leave feedback. Feedback forms will be added in a later phase. Every registered student counts as an attendee."}</p>
    <Button type="submit" disabled={pending} variant={type === "cancel" ? "destructive" : "default"} className="min-h-10">{pending ? "Saving..." : type === "cancel" ? "Yes, cancel session" : "Yes, complete session"}</Button>
  </details>{state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}</form>;
}
