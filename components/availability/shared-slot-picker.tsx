"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { getSharedSlots, type SlotResult } from "@/app/(app)/exchanges/slot-actions";
import { formatDateTime } from "@/lib/datetime";
import { meetingDateBounds } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
export function SharedSlotPicker({ kind, id, exclude, now }: { kind: "exchange" | "paid"; id: string; exclude?: string; now: number }) {
  const prefix = exclude ?? `${kind}-${id}`;
  const bounds = meetingDateBounds(now);
  const [day, setDay] = useState("");
  const [result, setResult] = useState<SlotResult>({ slots: [] });
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  async function findSlots(value: string) {
    const request = ++sequence.current;
    setSelected(""); setResult({ slots: [] });
    if (!value) { setLoading(false); return; }
    setLoading(true);
    try {
      const next = await getSharedSlots({ kind, id, day: value, exclude });
      if (request === sequence.current) setResult(next);
    } catch { if (request === sequence.current) setResult({ slots: [], error: "Could not load times. Try refreshing them." }); }
    finally { if (request === sequence.current) setLoading(false); }
  }
  return <div className="space-y-3">
    <div className="space-y-2"><Label htmlFor={`${prefix}-day`}>Meeting date (Philippine time)</Label><Input id={`${prefix}-day`} type="date" value={day} min={bounds.min} max={bounds.max} required onChange={event => { setDay(event.target.value); void findSlots(event.target.value); }} /></div>
    <div className="space-y-2"><Label htmlFor={`${prefix}-time`}>Shared free hour</Label><select id={`${prefix}-time`} name="startsAt" value={selected} onChange={event => setSelected(event.target.value)} required aria-busy={loading} className="h-11 w-full min-w-0 rounded-xl border bg-card px-3 text-base">
      <option value="">{loading ? "Finding shared times..." : result.slots.length ? "Choose a one-hour meeting" : "Choose a date to find times"}</option>{result.slots.map(iso => <option key={iso} value={iso}>{formatDateTime(iso)} (1 hour)</option>)}
    </select></div>
    <p className="text-sm text-muted-foreground">Only shared available hours appear. New meetings last one hour, with starts every 30 minutes, up to 30 days ahead.</p>
    {loading && <p role="status" className="text-sm">Checking both calendars...</p>}
    {result.error && <p role="alert" className="text-sm text-destructive">{result.error}</p>}
    {result.code === "own_availability_missing" && <Link href="/profile#availability" className="inline-flex min-h-11 items-center text-primary underline">Set my availability</Link>}
    {result.code === "partner_availability_missing" && <Link href={kind === "exchange" ? `/messages/${id}` : `/lessons/${id}#conversation`} className="inline-flex min-h-11 items-center text-primary underline">Message my learning partner</Link>}
    {day && <Button type="button" variant="outline" disabled={loading} onClick={() => void findSlots(day)}>Refresh shared times</Button>}
  </div>;
}
