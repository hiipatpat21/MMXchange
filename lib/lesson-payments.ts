import type { SupabaseClient } from "@supabase/supabase-js";

export const PAYMENT_IMAGE_LIMIT = 2 * 1024 * 1024;
export const paymentErrors: Record<string, string> = {
  not_authenticated: "Please sign in again.", not_allowed: "You cannot change this payment.",
  invalid_input: "Check your details. Rejection reasons need 5–300 characters.",
  invalid_image: "The image upload is incomplete or invalid. Choose the image again.",
  payment_method_required: "The tutor must upload a GCash QR in My skills before you reserve a paid lesson.",
  payment_closed: "This payment has changed or its reservation has passed. Refresh the lesson. Reschedule a past reservation before submitting or reviewing a receipt.",
  already_submitted: "This receipt was already submitted. Refresh to see its status.",
  invalid_transition: "This lesson changed. Refresh before trying again.",
};
export const paymentLabels: Record<string, string> = {
  not_requested: "Not requested", awaiting_receipt: "Awaiting receipt", submitted: "Awaiting tutor confirmation",
  rejected: "Receipt rejected — resubmit", confirmed: "Received by tutor",
};
export async function loadLessonPaymentDetails(client: SupabaseClient, id: string, page: number) {
  const [request, payment, booking, history] = await Promise.all([
    client.from("paid_lesson_requests").select("learner_id, tutor_id, status").eq("id", id).maybeSingle(),
    client.from("paid_lesson_payments").select("status, amount_centavos, qr_asset_id, instructions_snapshot, latest_receipt_id").eq("request_id", id).maybeSingle(),
    client.from("paid_lesson_bookings").select("status, starts_at").eq("request_id", id).maybeSingle(),
    client.from("paid_lesson_receipts").select("id, asset_id, status, rejection_reason, created_at, reviewed_at").eq("request_id", id).order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 5, page * 5),
  ]);
  return { request, payment, booking, history, now: Date.now() };
}
