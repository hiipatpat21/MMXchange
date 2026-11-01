"use client";

import { useActionState } from "react";
import { registerForSession, cancelRegistration } from "@/app/(app)/sessions/actions";
import { Button } from "@/components/ui/button";

export type PanelKind = "open" | "registered" | "full" | "closed" | "cancelled" | "completed";

export function RegistrationPanel({
  sessionId,
  panel,
  canCancel,
}: {
  sessionId: string;
  panel: PanelKind;
  canCancel: boolean;
}) {
  const [regState, regAction, regPending] = useActionState(registerForSession, null);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelRegistration, null);

  const box = "space-y-3 surface-card p-5";

  if (panel === "cancelled") {
    return <div className={box}><p className="font-medium">This session was cancelled.</p></div>;
  }
  if (panel === "completed") {
    return <div className={box}><p className="font-medium">This session has been completed.</p></div>;
  }
  if (panel === "closed") {
    return <div className={box}><p className="font-medium">Registration is closed.</p></div>;
  }
  if (panel === "full") {
    return (
      <div className={box}>
        <p className="font-medium">This session is full.</p>
        <p className="text-sm text-muted-foreground">Check back later in case a seat opens up.</p>
      </div>
    );
  }

  if (panel === "registered") {
    return (
      <div className={box}>
        <p className="font-medium text-primary">You&apos;re registered for this session.</p>
        {canCancel && (
          <form action={cancelAction}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <Button type="submit" variant="outline" disabled={cancelPending}>
              {cancelPending ? "Cancelling..." : "Cancel my registration"}
            </Button>
          </form>
        )}
        {cancelState?.error && (
          <p role="alert" className="text-sm text-destructive">{cancelState.error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={box}>
      <p className="font-medium">Seats are available.</p>
      <form action={regAction}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <Button type="submit" disabled={regPending}>
          {regPending ? "Registering..." : "Register for this session"}
        </Button>
      </form>
      {regState?.error && (
        <p role="alert" className="text-sm text-destructive">{regState.error}</p>
      )}
    </div>
  );
}
