import Link from "next/link";
import { forumCategories, type ForumPost } from "@/lib/forum";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";

export function PostCard({ post }: { post: ForumPost }) {
  const count = pickOne(post.forum_comments)?.count ?? 0;
  return <article className="space-y-3 surface-card p-5">
    <Badge variant="secondary">{forumCategories[post.category]}</Badge>
    <h2 className="break-words text-lg font-semibold [overflow-wrap:anywhere]"><Link href={`/forum/${post.id}`} className="inline-flex min-h-11 items-center text-primary hover:underline">{post.title}</Link></h2>
    <p className="line-clamp-3 whitespace-pre-line break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{post.body.slice(0, 240)}{post.body.length > 240 ? "…" : ""}</p>
    <p className="break-words text-xs text-muted-foreground"><Link href={`/students/${post.author_id}`} className="inline-flex min-h-11 items-center text-primary underline">{pickOne(post.author)?.display_name ?? "Student"}</Link> · {formatDateTime(post.created_at)} · {count} {count === 1 ? "reply" : "replies"}</p>
  </article>;
}
