import type { ExchangeStatus } from "@/lib/exchanges";

export const messagingStatuses: ExchangeStatus[] = ["pending", "accepted", "scheduled", "completed"];
export const canMessage = (status: ExchangeStatus) => messagingStatuses.includes(status);
export type MessageState = { error?: string; message?: string } | null;
export type MessageRow = { id: string; sender_id: string; body: string; created_at: string };
export type Conversation = {
  exchange_id: string; other_name: string; last_body: string | null;
  activity_at: string; unread: boolean;
};
