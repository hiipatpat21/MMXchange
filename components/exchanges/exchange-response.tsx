"use client";

import { useActionState } from "react";
import { respondToExchange } from "@/app/(app)/exchanges/actions";
import type { ExchangeActionState } from "@/lib/exchanges";
import { Button } from "@/components/ui/button";

async function submitResponse(_previous: ExchangeActionState, formData: FormData) {
  return respondToExchange(formData);
}

export function ExchangeResponse({ exchangeId, canRespond }: { exchangeId: string; canRespond: boolean }) {
  const [state, formAction, pending] = useActionState(submitResponse, null);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="exchangeId" value={exchangeId} />
      {canRespond ? (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="action" value="accept" disabled={pending} className="min-h-10">Accept request</Button>
          <Button type="submit" name="action" value="decline" variant="outline" disabled={pending} className="min-h-10">Decline request</Button>
        </div>
      ) : (
        <details className="rounded-xl border p-4">
          <summary className="flex min-h-10 cursor-pointer items-center text-sm font-medium text-destructive">Cancel exchange</summary>
          <p className="mt-2 text-sm text-muted-foreground">This ends the exchange. To start again, you will need a new request.</p>
          <Button type="submit" name="action" value="cancel" variant="destructive" disabled={pending} className="mt-3 min-h-10">Yes, cancel exchange</Button>
        </details>
      )}
      {pending && <p role="status" className="text-sm text-muted-foreground">Updating exchange...</p>}
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    </form>
  );
}
