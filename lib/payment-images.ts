import "server-only";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PAYMENT_IMAGE_LIMIT } from "@/lib/lesson-payments";

const formats: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
export async function validatePaymentImage(file: File) {
  if (!formats[file.type] || file.size < 1 || file.size > PAYMENT_IMAGE_LIMIT) throw new Error("Choose a JPG, PNG or WebP image up to 2 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== formats[file.type] || (metadata.pages ?? 1) !== 1) throw new Error("Unsupported image");
    await image.stats(); // Decode the original; do not alter payment evidence.
  } catch { throw new Error("This image could not be read. Choose a valid, still JPG, PNG or WebP image."); }
  return bytes;
}

// Both the asset SELECT and Storage SELECT run with the signed-in user's RLS.
// Never accept an object path or bucket from the browser.
export async function paymentImageUrl(client: SupabaseClient, assetId: string) {
  const { data, error } = await client.from("lesson_payment_assets").select("kind, object_path").eq("id", assetId).maybeSingle();
  if (error || !data) return null;
  const signed = await client.storage.from(data.kind === "qr" ? "lesson-qrs" : "lesson-receipts").createSignedUrl(data.object_path, 300);
  return signed.error ? null : signed.data.signedUrl;
}
