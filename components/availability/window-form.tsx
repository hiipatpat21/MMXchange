"use client";
import { useActionState } from "react";
import { changeAvailability } from "@/app/(app)/profile/availability-actions";
import { weekdays, minuteToTime } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
const selectClass = "h-11 w-full min-w-0 rounded-xl border bg-card px-3 text-base";
export function WindowForm() {
  const [state, action, pending] = useActionState(changeAvailability, null);
  return <form action={action} className="space-y-4"><input type="hidden" name="command" value="add" />
    <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="availability-weekday">Weekday</Label><select id="availability-weekday" name="weekday" defaultValue="1" className={selectClass}>{weekdays.map((day,index) => <option key={day} value={index}>{day}</option>)}</select></div>
      {["start", "end"].map(kind => <div key={kind} className="space-y-2"><Label htmlFor={`availability-${kind}`}>{kind === "start" ? "From" : "Until"}</Label><select id={`availability-${kind}`} name={kind} required defaultValue={kind === "start" ? "09:00" : "17:00"} className={selectClass}>{Array.from({length:kind === "start" ? 48 : 49},(_,i) => i*30).map(minute => <option key={minute} value={minuteToTime(minute)}>{minuteToTime(minute)}</option>)}</select></div>)}
    </div><p className="text-sm text-muted-foreground">Philippine time (24-hour clock). 24:00 is midnight.</p>
    <Button type="submit" variant="outline" disabled={pending}>{pending ? "Saving..." : "Add weekly hours"}</Button>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
  </form>;
}
