"use client";

import { useActionState } from "react";
import { deleteForumItem } from "@/app/(app)/forum/actions";
import { Button } from "@/components/ui/button";

export function DeleteControl({ id, kind }: { id: string; kind: "post" | "comment" }) {
  const [state, action, pending] = useActionState(deleteForumItem, null);
  if (state?.message) return <p role="status" className="text-sm text-primary">{state.message}</p>;
  return <details><summary className="flex min-h-11 cursor-pointer items-center text-sm text-destructive underline">Delete {kind}</summary>
    <form action={action} className="space-y-3 rounded-xl border p-4">
      <input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} />
      <p className="text-sm">Delete this {kind}? {kind === "post" ? "Its replies will also be removed. " : ""}This cannot be undone.</p>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Deleting…" : `Yes, delete ${kind}`}</Button>
    </form>
  </details>;
}
