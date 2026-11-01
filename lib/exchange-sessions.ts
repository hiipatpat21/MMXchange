import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExchangeDetail, ExchangeSession } from "@/lib/exchanges";

export async function loadExchangeSessions(supabase: SupabaseClient, exchangeId: string) {
  const sessions: ExchangeSession[] = [];
  // Load all slots; a response-size cap must not hide completion eligibility.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("exchange_sessions")
      .select("id, exchange_id, teacher_id, skill_id, starts_at, duration_minutes, format, venue, notes, status")
      .eq("exchange_id", exchangeId).order("starts_at").order("id").range(offset, offset + 499);
    if (error) return { sessions: [] as ExchangeSession[], error: true, now: Date.now() };
    sessions.push(...data as ExchangeSession[]);
    if (data.length < 500) return { sessions, error: false, now: Date.now() };
  }
}

// Passing the current time explicitly makes the next-action rules testable.
export function getExchangeProgress(exchange: ExchangeDetail, sessions: ExchangeSession[], userId: string, otherName: string, now: number) {
  const ownConfirmation = userId === exchange.requester_id ? exchange.requester_completed_at : exchange.recipient_completed_at;
  const started = sessions.some((slot) => slot.status !== "cancelled" && Date.parse(slot.starts_at) <= now);
  const nextSession = sessions.filter((slot) => slot.status === "scheduled" && Date.parse(slot.starts_at) > now).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0] ?? null;
  const canComplete = exchange.status === "scheduled" && started && !ownConfirmation;
  const currentStep = exchange.status === "completed" ? 4 : exchange.status === "scheduled" ? 3 : exchange.status === "accepted" ? 2 : 1;
  let nextAction = "Find another learning partner on Discover.";
  if (exchange.status === "pending") nextAction = userId === exchange.recipient_id ? "Review and respond to this request." : `Waiting for ${otherName} to respond.`;
  if (exchange.status === "accepted") nextAction = "Schedule your first session.";
  if (exchange.status === "scheduled") nextAction = ownConfirmation ? `Waiting for ${otherName} to confirm completion.` : started ? "Mark the exchange as completed." : "Prepare for your session.";
  if (exchange.status === "completed") nextAction = "Your exchange is complete. Feedback will be available in a later phase.";
  return { currentStep, nextAction, canComplete, nextSession };
}
