"use client";

import { useActionState } from "react";
import { addComment } from "@/app/(app)/forum/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(addComment, null);
  return <form action={action} className="space-y-3 surface-card p-5">
    <input type="hidden" name="postId" value={postId} />
    <Label htmlFor="comment-body">Add a helpful reply</Label><Textarea id="comment-body" name="body" required maxLength={2000} rows={3} placeholder="Share an explanation, follow-up question, or relevant resource." />
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Posting…" : "Post reply"}</Button>
  </form>;
}
