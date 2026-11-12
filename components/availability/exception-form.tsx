"use client";
import { useActionState } from "react";
import { changeAvailability } from "@/app/(app)/profile/availability-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function ExceptionForm({ min }: { min: string }) {
  const [state, action, pending] = useActionState(changeAvailability, null);
  return <form action={action} className="space-y-3"><input type="hidden" name="command" value="unavailable" /><Label htmlFor="unavailable-day">Date you cannot meet</Label><Input id="unavailable-day" type="date" name="day" min={min} required /><Button variant="outline" disabled={pending}>{pending ? "Saving..." : "Block this date"}</Button>{state?.error && <p role="alert" className="text-destructive">{state.error}</p>}{state?.message && <p role="status">{state.message}</p>}</form>;
}
export function RemoveAvailability({ id, day, label }: { id?: string; day?: string; label: string }) {
  const [state, action, pending] = useActionState(changeAvailability, null);
  return <form action={action}><input type="hidden" name="command" value={id ? "remove" : "available"} /><input type="hidden" name={id ? "id" : "day"} value={id ?? day} /><Button type="submit" variant="ghost" disabled={pending} aria-label={label}>Remove</Button>{state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}</form>;
}
