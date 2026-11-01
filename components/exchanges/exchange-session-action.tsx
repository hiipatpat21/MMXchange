"use client";

import { useActionState } from "react";
import { cancelSession, markExchangeComplete } from "@/app/(app)/exchanges/actions";
import { Button } from "@/components/ui/button";

export function ExchangeSessionAction({ id, type }: { id: string; type: "cancel" | "complete" }) {
  const [state, action, pending] = useActionState(type === "cancel" ? cancelSession : markExchangeComplete, null);
  const button = <Button type="submit" disabled={pending} variant={type === "cancel" ? "destructive" : "default"} className="min-h-10">{pending ? "Saving..." : type === "cancel" ? "Yes, cancel session" : "Mark exchange as completed"}</Button>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name={type === "cancel" ? "sessionId" : "exchangeId"} value={id} />
      {type === "cancel" ? <details className="rounded-lg border p-3">
        <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-destructive">Cancel this session</summary>
        <p className="mb-3 text-sm text-muted-foreground">Cancel this teaching slot? If it is the last one, you will need to schedule again. Completion confirmations will be cleared.</p>
        {button}
      </details> : button}
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    </form>
  );
}
