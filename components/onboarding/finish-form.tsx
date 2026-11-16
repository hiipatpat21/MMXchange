"use client";
import { useActionState } from "react";
import { finishSetup } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";

export function FinishForm() {
  const [state, action, pending] = useActionState(finishSetup, null);
  return <form action={action} className="space-y-3">
    <p className="text-sm text-muted-foreground">Add skills or skip for now. You can edit them later.</p>
    <div className="flex flex-wrap gap-3">
      <Button type="submit" name="intent" value="continue" disabled={pending}>{pending ? "Finishing..." : "Save and continue"}</Button>
      <Button type="submit" name="intent" value="skip" variant="outline" disabled={pending}>Skip for now</Button>
    </div>
    {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}
  </form>;
}
