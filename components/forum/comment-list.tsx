import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { formatDateTime } from "@/lib/datetime";
import type { ForumComment } from "@/lib/forum";
import { DeleteControl } from "@/components/forum/delete-control";
import { ReportControl } from "@/components/feedback/report-control";

export async function CommentList({ postId, userId, page }: { postId: string; userId: string; page: number }) {
  const supabase = await createClient();
  const { data, error, count } = await supabase.from("forum_comments").select("id, author_id, body, created_at, author:profiles!author_id(display_name)", { count: "exact" }).eq("post_id", postId).order("created_at").order("id").range((page - 1) * 30, page * 30 - 1);
  if (error) return <p role="alert" className="text-destructive">Could not load replies. Please reload to try again.</p>;
  const rows = (data ?? []) as ForumComment[];
  const lastPage = Math.max(1, Math.ceil((count ?? 0) / 30));
  return <section id="comments" className="space-y-4"><h2 className="text-lg font-semibold">Replies ({count ?? 0})</h2>
    {rows.length ? <ol className="space-y-3">{rows.map(comment => <li key={comment.id} className="space-y-3 surface-card p-5">
      <p className="break-words text-sm font-medium"><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/students/${comment.author_id}`}>{pickOne(comment.author)?.display_name ?? "Student"}</Link><span className="text-xs font-normal text-muted-foreground"> · {formatDateTime(comment.created_at)}</span></p>
      <p className="whitespace-pre-line break-words text-sm [overflow-wrap:anywhere]">{comment.body}</p>
      {comment.author_id === userId ? <DeleteControl id={comment.id} kind="comment" /> : <ReportControl targetType="forum_comment" targetId={comment.id} />}
    </li>)}</ol> : <p className="surface-card p-5 text-sm text-muted-foreground">{page === 1 ? "No replies yet. Share a helpful response using the form below." : "No replies on this page."}</p>}
    <nav aria-label="Reply pages" className="flex flex-wrap gap-4 text-sm">
      {page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/forum/${postId}?page=${Math.min(page - 1, lastPage)}#comments`}>Previous replies</Link>}
      {page < lastPage && <><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/forum/${postId}?page=${page + 1}#comments`}>Next replies</Link><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/forum/${postId}?page=${lastPage}#comments`}>Last page</Link></>}
    </nav>
  </section>;
}
