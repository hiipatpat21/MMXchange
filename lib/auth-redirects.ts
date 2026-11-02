export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") throw new Error("Set NEXT_PUBLIC_SITE_URL for password recovery.");
  const url = new URL(configured || "http://localhost:3000");
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error("Invalid site URL.");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Use HTTPS for the production site URL.");
  return url.origin;
}

export function safeAuthNext(value: string | null): string {
  if (!value) return "/dashboard";
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return "/dashboard"; }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/dashboard";
  if (/%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(decoded)) return "/dashboard";
  return value;
}

export function emailDomainAllowed(email: string, configured: string | undefined): boolean {
  const allowed = (configured ?? "").split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  return allowed.length === 0 || allowed.includes(domain);
}
