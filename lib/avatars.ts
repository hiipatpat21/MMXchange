export const avatarMaxBytes = 2 * 1024 * 1024;
export const avatarMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export function avatarFileError(file: { type: string; size: number }): string | null {
  if (!avatarMimeTypes.some((type) => type === file.type)) return "Choose a JPG, PNG, or WebP image.";
  if (file.size <= 0 || file.size > avatarMaxBytes) return "Choose an image up to 2 MB.";
  return null;
}

export function isOwnAvatarPath(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && /^avatar-\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(path.slice(userId.length + 1));
}

export function trustedAvatarUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!origin) return undefined;
  const prefix = `${origin.replace(/\/$/, "")}/storage/v1/object/public/avatars/`;
  if (!value.startsWith(prefix)) return undefined;
  const path = value.slice(prefix.length);
  const id = path.split("/")[0];
  return /^[0-9a-f-]{36}$/.test(id) && isOwnAvatarPath(path, id) ? value : undefined;
}
