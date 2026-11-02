"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { avatarFileError, avatarMimeTypes } from "@/lib/avatars";
import { saveAvatar } from "@/app/(app)/profile/actions";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AvatarUpload({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("avatarFile");
    setError(null); setMessage(null);
    if (!(file instanceof File)) { setError("Choose a photo first."); return; }
    const invalid = avatarFileError(file);
    if (invalid) { setError(invalid); return; }
    setPending(true);
    const supabase = createClient();
    let uploadedPath: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setError("Please sign in before uploading a photo."); return; }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = `${user.id}/avatar-${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { setError("Could not upload the photo. Check the file and try again."); return; }
      uploadedPath = path;
      const data = new FormData(); data.set("path", path);
      const state = await saveAvatar(null, data);
      if (state?.error) { setError(state.error); return; }
      uploadedPath = null;
      setMessage("Profile photo saved."); form.reset(); router.refresh();
    } catch { setError("Could not save the photo. Please try again."); }
    finally {
      // Discard this attempt's uploaded file if saving the profile failed.
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]).catch(() => {});
      setPending(false);
    }
  }
  return <section className="surface-card space-y-5 p-5 sm:p-7" aria-labelledby="avatar-heading">
    <div className="flex items-center gap-4"><StudentAvatar name={displayName} url={avatarUrl} className="size-20" /><div><h2 id="avatar-heading" className="text-lg font-semibold">Profile photo</h2><p className="text-sm text-muted-foreground">Optional. Initials are shown when you have no photo.</p></div></div>
    <form onSubmit={upload} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="avatarFile">Choose a photo</Label><input id="avatarFile" name="avatarFile" type="file" accept={avatarMimeTypes.join(",")} required disabled={pending} aria-describedby="avatar-hint" className="block min-h-11 w-full min-w-0 rounded-xl border border-input bg-card p-2 text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:font-medium" /><p id="avatar-hint" className="text-sm text-muted-foreground">JPG, PNG, or WebP, up to 2 MB. Photos are public to anyone with the image link.</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Uploading..." : "Save profile photo"}</Button>
    </form>
  </section>;
}
