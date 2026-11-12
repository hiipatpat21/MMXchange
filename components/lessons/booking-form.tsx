"use client";
import { useActionState } from "react";
import { reservePaidBooking } from "@/app/(app)/lessons/booking-actions";
import { SharedSlotPicker } from "@/components/availability/shared-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function PaidBookingForm({ id, now, booking }: { id: string; now: number; booking?: { format: string; venue: string } | null }) {
  const [state, action, pending] = useActionState(reservePaidBooking,null);
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={id} /><SharedSlotPicker kind="paid" id={id} now={now} />
    <div className="space-y-2"><Label htmlFor="paid-format">Meeting format</Label><select id="paid-format" name="format" defaultValue={booking?.format ?? "online"} className="h-11 w-full rounded-xl border bg-card px-3"><option value="online">Online</option><option value="in_person">In person</option></select></div>
    <div className="space-y-2"><Label htmlFor="paid-venue">Venue or meeting link</Label><Input id="paid-venue" name="venue" required minLength={2} maxLength={200} defaultValue={booking?.venue ?? ""} /></div>
    <p className="text-sm text-muted-foreground">An unpaid reservation holds both calendars until cancellation or tutor payment confirmation. It does not expire automatically. Failed rescheduling keeps the old time.</p>
    <Button disabled={pending}>{pending ? "Saving..." : booking ? "Reschedule lesson" : "Reserve this hour"}</Button>
    {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}{state?.message && <p role="status">{state.message}</p>}
  </form>;
}
