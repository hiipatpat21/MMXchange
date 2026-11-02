import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forumCategories, forumFilterSchema, forumSearchFilter, forumUrl, type ForumPost, type ForumQuery } from "@/lib/forum";
import { PostCard } from "@/components/forum/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";

async function Forum({ searchParams }: { searchParams: Promise<ForumQuery> }) {
  const parsed = forumFilterSchema.safeParse(await searchParams);
  if (!parsed.success) return <p role="alert" className="text-sm text-destructive">These filters are invalid. <Link href="/forum" className="inline-flex min-h-11 items-center underline">Reset filters</Link></p>;
  const filters = parsed.data;
  const { q, category, mine, page } = filters;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  let request = supabase.from("forum_posts").select("id, author_id, category, title, body, created_at, updated_at, author:profiles!author_id(display_name), forum_comments(count)").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (category) request = request.eq("category", category);
  if (mine) request = request.eq("author_id", user.id);
  if (q) request = request.or(forumSearchFilter(q));
  const { data, error } = await request.range((page - 1) * 20, page * 20);
  const rows = (data ?? []) as ForumPost[];
  return <>
    <form action="/forum" method="get" className="space-y-4 surface-card p-5">
      {category && <input type="hidden" name="category" value={category} />}
      <div className="space-y-2"><Label htmlFor="forum-search">Search titles and posts</Label><Input key={q} id="forum-search" type="search" name="q" maxLength={100} defaultValue={q} placeholder="Search a question or resource…" /></div>
      <div className="flex flex-wrap items-center gap-4"><Label htmlFor="forum-mine" className="flex min-h-11 cursor-pointer items-center gap-2"><input key={String(mine)} id="forum-mine" type="checkbox" name="mine" value="1" defaultChecked={mine} className="size-4 accent-primary" />My posts</Label><Button type="submit" variant="outline">Apply filters</Button><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href="/forum">Clear filters</Link></div>
    </form>
    <nav aria-label="Forum categories" className="flex flex-wrap gap-2">{[["", "All categories"], ...Object.entries(forumCategories)].map(([value, label]) => <Link key={value} href={forumUrl({ ...filters, category: value, page: 1 })} aria-current={category === value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors ${category === value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{label}</Link>)}</nav>
    {error ? <p role="alert" className="text-destructive">Could not load forum posts. Please reload. On a new setup, run the prompt 10 SQL first.</p> : rows.length ? <ul className="space-y-4">{rows.slice(0, 20).map(post => <li key={post.id}><PostCard post={post} /></li>)}</ul> : <div className="space-y-3 surface-card p-5"><p className="font-medium">{q || category || mine ? "No posts match these filters." : "No discussions yet."}</p><p className="text-sm text-muted-foreground">Ask a question, share something you learned, or recommend a resource.</p><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href={q || category || mine ? "/forum" : "/forum/new"}>{q || category || mine ? "Clear filters" : "Create the first post"}</Link></div>}
    {!error && <nav aria-label="Forum pages" className="flex gap-5 text-sm">{page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={forumUrl({ ...filters, page: page - 1 })}>Previous</Link>}{rows.length > 20 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={forumUrl({ ...filters, page: page + 1 })}>Next</Link>}</nav>}
  </>;
}

export default function ForumPage({ searchParams }: { searchParams: Promise<ForumQuery> }) {
  return <div className="mx-auto max-w-3xl space-y-6"><header className="flex flex-wrap items-center justify-between gap-4"><div className="space-y-2"><h1 className="page-heading">Learning forum</h1><p className="text-muted-foreground">Questions, explanations, and resources from students.</p></div><Button asChild><Link href="/forum/new">Create post</Link></Button></header><Suspense fallback={<LoadingState label="Loading forum…" />}><Forum searchParams={searchParams} /></Suspense></div>;
}
