import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { forumCategories, type ForumPost, type ForumQuery } from "@/lib/forum";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ReportControl } from "@/components/feedback/report-control";
import { DeleteControl } from "@/components/forum/delete-control";
import { CommentList } from "@/components/forum/comment-list";
import { CommentForm } from "@/components/forum/comment-form";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<ForumQuery> };
async function ForumPostDetail({ params, searchParams }: Props) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const page = z.string().regex(/^[1-9]\d{0,4}$/).default("1").transform(Number).safeParse(query.page);
  if (!page.success) notFound();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data, error } = await supabase.from("forum_posts").select("id, author_id, title, body, category, created_at, updated_at, author:profiles!author_id(display_name)").eq("id", id).maybeSingle();
  if (error) return <p role="alert" className="text-destructive">Could not load this post. Please reload to try again.</p>;
  if (!data) notFound();
  const post = data as Omit<ForumPost, "forum_comments">;
  return <article className="mx-auto max-w-2xl space-y-6"><header className="space-y-3"><Badge variant="secondary">{forumCategories[post.category]}</Badge><h1 className="page-heading break-words [overflow-wrap:anywhere]">{post.title}</h1><p className="break-words text-sm text-muted-foreground"><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/students/${post.author_id}`}>{pickOne(post.author)?.display_name ?? "Student"}</Link> · {formatDateTime(post.created_at)}</p>{post.updated_at !== post.created_at && <p className="text-xs text-muted-foreground">Updated {formatDateTime(post.updated_at)}</p>}</header>
    <section aria-label="Post content" className="space-y-4 surface-card p-5"><p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">{post.body}</p>{post.author_id === user.id ? <DeleteControl id={id} kind="post" /> : <ReportControl targetType="forum_post" targetId={id} />}</section>
    <Suspense fallback={<LoadingState label="Loading replies…" />}><CommentList postId={id} userId={user.id} page={page.data} /></Suspense>
    <CommentForm postId={id} />
    <Link href="/forum" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to forum</Link>
  </article>;
}
export default function PostPage(props: Props) {
  return <Suspense fallback={<LoadingState label="Loading discussion…" />}><ForumPostDetail {...props} /></Suspense>;
}
