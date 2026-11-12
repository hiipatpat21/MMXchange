"use client";
import { useActionState } from "react";
import { changePaidLesson } from "@/app/(app)/lessons/actions";
import { Button } from "@/components/ui/button";
export function LessonAction({ id, action: command, price, label }: { id: string; action: "accept" | "decline" | "cancel" | "complete"; price?: number; label: string }) {
  const [state, action, pending] = useActionState(changePaidLesson, null);
  return <form action={action} className="space-y-2"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={command} />{price !== undefined && <input type="hidden" name="price" value={price} />}<Button variant="outline" disabled={pending}>{pending ? "Saving..." : label}</Button>{state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}</form>;
}
