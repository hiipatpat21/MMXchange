"use client";

import { useActionState, useId } from "react";
import { submitReport } from "@/app/(app)/feedback/actions";
import type { ReportType } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportControl({ targetType, targetId }: { targetType: ReportType; targetId: string }) {
  const [state, action, pending] = useActionState(submitReport, null);
  const id = useId();
  return <details className="mt-2"><summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground underline">Report</summary>
    {state?.message ? <p role="status" className="text-sm text-primary">{state.message}</p> : <form action={action} className="space-y-3 rounded-xl border p-4">
      <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
      <Label htmlFor={id}>Why are you reporting this? (5–500 characters)</Label><Textarea id={id} name="reason" required minLength={5} maxLength={500} rows={3} disabled={pending} />
      <p className="text-xs text-muted-foreground">Your report is private. Reporting does not automatically remove content.</p>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Submitting…" : "Submit report"}</Button>
    </form>}
  </details>;
}
