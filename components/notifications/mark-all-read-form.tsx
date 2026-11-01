"use client";

import { useActionState } from "react";
import { markAllAsRead } from "@/app/(app)/notifications/actions";
import { Button } from "@/components/ui/button";

export function MarkAllReadForm() {
  const [state, action, pending] = useActionState(markAllAsRead, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="action" value="mark_all" />
      <Button type="submit" variant="outline" disabled={pending} className="min-h-11">{pending ? "Saving..." : "Mark all as read"}</Button>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    </form>
  );
}
