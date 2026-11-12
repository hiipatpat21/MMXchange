"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validatePaymentImage } from "@/lib/payment-images";
import { paymentErrors } from "@/lib/lesson-payments";
import type { LessonState } from "@/lib/paid-lessons";

function refresh(id?: string) {
  revalidatePath("/", "layout");
  for (const path of ["/skills", "/exchanges", "/dashboard", "/notifications", "/discover"]) revalidatePath(path);
  if (id) revalidatePath(`/lessons/${id}`);
}
function failure(code: unknown): LessonState { return { error: paymentErrors[String(code)] ?? "Could not save this payment change. Refresh and try again." }; }

export async function uploadPaymentImage(_previous: LessonState, form: FormData): Promise<LessonState> {
  const parsed = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("qr"), instructions: z.string().trim().max(500) }),
    z.object({ kind: z.literal("receipt"), id: z.string().uuid() }),
  ]).safeParse({ kind: form.get("kind"), instructions: form.get("instructions") ?? "", id: form.get("id") });
  const image = form.get("image");
  if (!parsed.success || !(image instanceof File)) return { error: "Choose an image and check the form details." };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return failure("not_authenticated");
  const d = parsed.data;
  let bytes: Buffer;
  try { bytes = await validatePaymentImage(image); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not read this image." }; }
  try {
    const allocation = await client.rpc("allocate_payment_asset", { p_kind: d.kind, p_request: d.kind === "receipt" ? d.id : null, p_mime: image.type, p_size: bytes.length });
    if (allocation.error || typeof allocation.data !== "string") return failure(null);
    if (!allocation.data.startsWith("ok:")) return failure(allocation.data);
    const asset = z.string().uuid().safeParse(allocation.data.slice(3));
    if (!asset.success) return failure(null);
    const extension = image.type === "image/jpeg" ? "jpg" : image.type === "image/png" ? "png" : "webp";
    const path = `${user.id}/${asset.data}.${extension}`;
    const bucket = d.kind === "qr" ? "lesson-qrs" : "lesson-receipts";
    const uploaded = await client.storage.from(bucket).upload(path, bytes, { contentType: image.type, upsert: false, cacheControl: "0" });
    if (uploaded.error) return { error: "Upload failed. Check your connection and try again. No payment was confirmed." };
    const result = d.kind === "qr"
      ? await client.rpc("save_tutor_payment_method", { p_asset: asset.data, p_instructions: d.instructions })
      : await client.rpc("submit_lesson_receipt", { p_request: d.id, p_asset: asset.data });
    if (result.error || result.data !== "ok") return failure(result.data);
    refresh(d.kind === "receipt" ? d.id : undefined);
    return { message: d.kind === "qr" ? "Payment method saved. Existing lesson instructions stay unchanged." : "Receipt submitted. Awaiting tutor confirmation." };
  } catch { return { error: "Connection interrupted. Refresh to check whether the upload was submitted before trying again." }; }
}

export async function changeLessonPayment(_previous: LessonState, form: FormData): Promise<LessonState> {
  const parsed = z.discriminatedUnion("command", [
    z.object({ command: z.literal("prepare"), id: z.string().uuid() }),
    z.object({ command: z.literal("confirm"), id: z.string().uuid(), receipt: z.string().uuid() }),
    z.object({ command: z.literal("reject"), id: z.string().uuid(), receipt: z.string().uuid(), reason: z.string().trim().min(5).max(300) }),
  ]).safeParse({ command: form.get("command"), id: form.get("id"), receipt: form.get("receipt"), reason: form.get("reason") });
  if (!parsed.success) return failure("invalid_input");
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return failure("not_authenticated");
  const d = parsed.data;
  try {
    const { data, error } = d.command === "prepare" ? await client.rpc("prepare_lesson_payment", { p_request: d.id })
      : await client.rpc("review_lesson_receipt", { p_request: d.id, p_receipt: d.receipt, p_decision: d.command, p_reason: d.command === "reject" ? d.reason : "" });
    if (error || data !== "ok") return failure(data);
    refresh(d.id);
    return { message: d.command === "confirm" ? "Payment marked received. This meeting is now confirmed." : d.command === "reject" ? "Receipt rejected. The learner can submit a new image." : "Payment instructions ready." };
  } catch { return { error: "Connection interrupted. Refresh to check the latest payment status." }; }
}
