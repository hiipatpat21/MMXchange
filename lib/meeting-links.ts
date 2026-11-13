export const MEETING_LOCATION_LIMIT = 200;
export const meetingUrlHint = "For online meetings, enter a complete http:// or https:// URL (up to 200 characters). HTTPS is recommended.";

// This parser only validates an address. It never fetches or opens it.
export function parseMeetingUrl(value: unknown): { href: string; host: string } | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > MEETING_LOCATION_LIMIT || !/^https?:\/\//i.test(text)
    || /[\s\u0000-\u001f\u007f<>"'`\\]/u.test(text)
    || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(text)) return null;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    // URL() permits some invalid DNS labels. IPv6 is already checked by URL().
    if (!url.hostname.startsWith('[') && !url.hostname.replace(/\.$/, '').split('.').every(label => label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))) return null;
    return { href: url.href, host: url.host };
  } catch { return null; }
}

export function validMeetingLocation(value: { format: string; venue: string }) {
  return value.format !== "online" || parseMeetingUrl(value.venue) !== null;
}
