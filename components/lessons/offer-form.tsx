"use client";
import { useActionState } from "react";
import { savePaidOffer } from "@/app/(app)/lessons/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
export function OfferForm({ skill, name, price = 0, enabled = false, teaching = true }: { skill: number; name: string; price?: number; enabled?: boolean; teaching?: boolean }) {
  const [state, action, pending] = useActionState(savePaidOffer, null);
  return <form action={action} className="space-y-3 rounded-xl border bg-card p-5">
    <h3 className="font-semibold">{name}</h3><input type="hidden" name="skill" value={skill} />
    <div className="space-y-2"><Label htmlFor={`price-${skill}`}>PHP per one-hour lesson</Label><Input id={`price-${skill}`} name="price" type="number" min="0.01" max="10000" step="0.01" inputMode="decimal" defaultValue={price ? (price / 100).toFixed(2) : ""} required /></div>
    <Label htmlFor={`offer-${skill}`} className="flex items-center gap-3"><input id={`offer-${skill}`} name="enabled" type="checkbox" defaultChecked={enabled && teaching} disabled={!teaching || pending} />Offer paid lessons for this skill</Label>
    {!teaching && <p className="text-sm">This skill is no longer in your teaching list. Save to withdraw its offering.</p>}
    <Button type="submit" variant="outline" disabled={pending}>{pending ? "Saving..." : "Save offering"}</Button>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
  </form>;
}
