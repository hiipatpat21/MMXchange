import { pickOne } from "@/lib/relations";

export type ExchangeStatus = "pending" | "accepted" | "scheduled" | "completed" | "declined" | "cancelled";
export type ExchangeActionState = { error?: string; message?: string } | null;
export type ExchangeSkill = { id: number; name: string };
type Relation<T> = T | T[] | null;

export type ExchangeRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ExchangeStatus;
  created_at: string;
  requester: Relation<{ display_name: string }>;
  recipient: Relation<{ display_name: string }>;
  learn_skill: Relation<{ name: string }>;
  teach_skill: Relation<{ name: string }>;
};

// Every embedded relation names its FK column because there are two paths
// to profiles and two paths to skills.
export const exchangeSelect = "id, requester_id, recipient_id, status, created_at, requester:profiles!requester_id(display_name), recipient:profiles!recipient_id(display_name), learn_skill:skills!learn_skill_id(name), teach_skill:skills!teach_skill_id(name)";

export function exchangePerspective(exchange: ExchangeRow, userId: string) {
  const requester = exchange.requester_id === userId;
  return {
    otherId: requester ? exchange.recipient_id : exchange.requester_id,
    otherName: pickOne(requester ? exchange.recipient : exchange.requester)?.display_name ?? "Student",
    youTeach: pickOne(requester ? exchange.teach_skill : exchange.learn_skill)?.name ?? "Unknown skill",
    theyTeach: pickOne(requester ? exchange.learn_skill : exchange.teach_skill)?.name ?? "Unknown skill",
  };
}

export const exchangeFormats = { in_person: "In person", online: "Online", either: "Either in person or online" };
