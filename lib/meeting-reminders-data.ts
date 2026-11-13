import type { SupabaseClient } from "@supabase/supabase-js";
import { pickOne } from "@/lib/relations";
import { reminderTiming, REMINDER_AFTER_START_MS, REMINDER_WINDOW_MS, type ReminderMeeting } from "@/lib/meeting-reminders";

// The caller supplies only an auth.getUser() identity; RLS and explicit participant checks both apply.
export async function loadMeetingReminders(client: SupabaseClient, userId: string, clock = () => Date.now()) {
  const from = new Date(clock()-REMINDER_AFTER_START_MS).toISOString();
  const until = new Date(clock()+REMINDER_WINDOW_MS).toISOString();
  const meetings: ReminderMeeting[] = [];
  for (const kind of ["exchange","paid"] as const) {
    for (let offset=0; ; offset+=500) {
      const query = kind === "exchange"
        ? client.from("exchange_sessions").select("id, exchange_id, starts_at, format, venue, status, skills!skill_id(name), exchange:exchange_requests!exchange_id!inner(status,requester_id,recipient_id)")
          .eq("status","scheduled").eq("exchange.status","scheduled")
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`,{referencedTable:"exchange"})
        : client.from("paid_lesson_bookings").select("request_id, starts_at, format, venue, status, request:paid_lesson_requests!request_id!inner(status,learner_id,tutor_id,skill_name,agreed_price_centavos,payment:paid_lesson_payments!request_id!inner(status,amount_centavos))")
          .eq("status","confirmed").eq("request.status","accepted").eq("request.payment.status","confirmed")
          .or(`learner_id.eq.${userId},tutor_id.eq.${userId}`,{referencedTable:"request"});
      const { data, error } = await query.gte("starts_at",from).lte("starts_at",until).order("starts_at").order(kind === "exchange" ? "id" : "request_id").range(offset,offset+499);
      if (error) throw new Error("Could not load meeting reminders.");
      for (const row of data ?? []) {
        if (kind === "exchange") {
          if (!("exchange" in row)) continue;
          const parent = pickOne<{status:string;requester_id:string;recipient_id:string}>(row.exchange);
          if (!parent || row.status !== "scheduled" || parent.status !== "scheduled" || ![parent.requester_id,parent.recipient_id].includes(userId)) continue;
          meetings.push({kind,id:row.id,title:pickOne<{name:string}>(row.skills)?.name ?? "Skill swap",startsAt:row.starts_at,format:row.format,venue:row.venue,href:`/exchanges/${row.exchange_id}#sessions-heading`});
        } else {
          if (!("request" in row)) continue;
          const parent = pickOne<{status:string;learner_id:string;tutor_id:string;skill_name:string;agreed_price_centavos:number;payment:{status:string;amount_centavos:number}|{status:string;amount_centavos:number}[]}>(row.request);
          const payment = pickOne(parent?.payment);
          if (!parent || row.status !== "confirmed" || parent.status !== "accepted" || ![parent.learner_id,parent.tutor_id].includes(userId) || payment?.status !== "confirmed" || payment.amount_centavos !== parent.agreed_price_centavos) continue;
          meetings.push({kind,id:row.request_id,title:parent.skill_name,startsAt:row.starts_at,format:row.format,venue:row.venue,href:`/lessons/${row.request_id}#meeting`});
        }
      }
      if ((data?.length ?? 0)<500) break;
    }
  }
  const serverNow = clock();
  return {serverNow,meetings:meetings.filter(row => reminderTiming(row.startsAt,serverNow))};
}
