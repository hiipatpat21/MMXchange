import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, safeAuthNext } from "@/lib/auth-redirects";
import { getRecoveryBinding, recoveryCookieName, recoveryCookieOptions } from "@/lib/recovery";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const parsed = z.object({
    code: z.string().min(1).max(2048),
    flowId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/).nullable(),
  }).safeParse({ code: query.get("code"), flowId: query.get("sb_flow_id") });
  const cookieStore = await cookies();
  cookieStore.delete(recoveryCookieName);
  let origin: string;
  try { origin = getSiteUrl(); }
  catch { return NextResponse.redirect(new URL("/login?error=auth_callback", request.url)); }
  const failure = () => NextResponse.redirect(new URL("/login?error=auth_callback", origin));
  if (!parsed.success || query.has("error")) return failure();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.data.code, parsed.data.flowId ? { flowId: parsed.data.flowId } : undefined);
  if (error || !data.session) return failure();
  let destination = safeAuthNext(query.get("next"));
  // The installed SDK returns redirectType at runtime, although its public
  // response type omits it. Validate the extra field instead of casting it.
  const isRecovery = z.object({ redirectType: z.literal("recovery") }).safeParse(data).success;
  if (isRecovery) {
    const binding = await getRecoveryBinding(supabase);
    if (!binding) return failure();
    cookieStore.set(recoveryCookieName, binding.value, recoveryCookieOptions);
    destination = "/reset-password";
  } else if (destination.split(/[?#]/)[0] === "/reset-password") {
    destination = "/dashboard";
  }
  return NextResponse.redirect(new URL(destination, origin));
}
