"use client";

import { useActionState } from "react";
import { createPost } from "@/app/(app)/forum/actions";
import { forumCategories } from "@/lib/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PostForm() {
  const [state, action, pending] = useActionState(createPost, null);
  return <form action={action} className="space-y-5 surface-card p-5">
    <div className="space-y-2"><Label htmlFor="post-title">Title</Label><Input id="post-title" name="title" required minLength={5} maxLength={120} placeholder="What would you like to learn or share?" /></div>
    <div className="space-y-2"><Label htmlFor="post-category">Category</Label><select id="post-category" name="category" required defaultValue="general" className="w-full rounded-xl border bg-background px-3 text-sm">{Object.entries(forumCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div className="space-y-2"><Label htmlFor="post-body">Post</Label><Textarea id="post-body" name="body" required minLength={10} maxLength={5000} rows={8} placeholder="Ask a clear question, explain what you have tried, or share a useful learning resource." /><p className="text-xs text-muted-foreground">10–5,000 characters. Posts are visible to logged-in students.</p></div>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Posting…" : "Create post"}</Button>
  </form>;
}
