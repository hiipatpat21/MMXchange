import { pruneReminderRecords, type ReminderRecords } from "@/lib/meeting-reminders";
type BrowserStorage = Pick<Storage,"getItem" | "setItem" | "removeItem">;
export function reminderStorageKeys(userId: string) {
  return {records:`mmxchange.reminders.v1.${userId}`,leader:`mmxchange.reminder-leader.v1.${userId}`};
}
export function readReminderRecords(storage: BrowserStorage, key: string, now: number) {
  const raw = storage.getItem(key);
  let value: unknown;
  try { value = JSON.parse(raw ?? "{}"); } catch { value = {}; }
  return pruneReminderRecords(value,now);
}
export function writeReminderRecords(storage: BrowserStorage, key: string, records: ReminderRecords) {
  storage.setItem(key,JSON.stringify(records));
}
// Fallback for browsers without Web Locks. Only the owner renews/releases a live lease.
export function claimReminderLease(storage: BrowserStorage, key: string, owner: string, now: number) {
  let old: {owner?:string;expiresAt?:number} = {};
  try { old = JSON.parse(storage.getItem(key) ?? "{}"); } catch { /* Replace corrupt lease metadata. */ }
  if (old && old.owner !== owner && typeof old.expiresAt === "number" && old.expiresAt>now && old.expiresAt<=now+30_000) return false;
  storage.setItem(key,JSON.stringify({owner,expiresAt:now+15_000}));
  return JSON.parse(storage.getItem(key) ?? "{}").owner === owner;
}
export function releaseReminderLease(storage: BrowserStorage, key: string, owner: string) {
  let lease;
  try { lease = JSON.parse(storage.getItem(key) ?? "{}"); } catch { return; }
  if (lease?.owner === owner) storage.removeItem(key);
}
