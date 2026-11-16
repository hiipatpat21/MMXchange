"use client";
import { useActionState, useState } from "react";
import { reservePaidBooking } from "@/app/(app)/lessons/booking-actions";
import { SharedSlotPicker } from "@/components/availability/shared-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function PaidBookingForm({ id, now, booking }: { id: string; now: number; booking?: { format: string; venue: string } | null }) {
  const [state, action, pending] = useActionState(reservePaidBooking,null);
  const [format, setFormat] = useState(booking?.format ?? "online");
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={id} /><SharedSlotPicker kind="paid" id={id} now={now} />
    <div className="space-y-2"><Label htmlFor="paid-format">Meeting format</Label><select id="paid-format" name="format" defaultValue={booking?.format ?? "online"} onChange={event => setFormat(event.target.value)} className="h-11 w-full rounded-xl border bg-card px-3"><option value="online">Online</option><option value="in_person">In person</option></select></div>
    <div className="space-y-2"><Label htmlFor="paid-venue">{format === "online" ? "Online meeting URL" : "In-person venue"}</Label><Input id="paid-venue" name="venue" type={format === "online" ? "url" : "text"} required minLength={2} maxLength={200} defaultValue={booking?.venue ?? ""} placeholder={format === "online" ? "https://meet.example.com/your-meeting" : "Public meeting place"} /></div>
    <p className="text-sm text-muted-foreground">This hour stays held until payment is confirmed or the lesson is cancelled.</p>
    <Button disabled={pending}>{pending ? "Saving..." : booking ? "Reschedule lesson" : "Reserve this hour"}</Button>
    {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}{state?.message && <p role="status">{state.message}</p>}
  </form>;
}
