import { z } from "zod";

export const forumCategories = {
  programming: "Programming", design: "Design", academics: "Academics", career: "Career",
  creative: "Creative", resources: "Resources", general: "General",
} as const;
export const forumCategorySchema = z.enum(["programming", "design", "academics", "career", "creative", "resources", "general"]);
export const forumPostSchema = z.object({
  title: z.string().trim().min(5).max(120), category: forumCategorySchema,
  body: z.string().trim().min(10).max(5000),
});
export const forumCommentSchema = z.object({ postId: z.string().uuid(), body: z.string().trim().min(1).max(2000) });
export type ForumState = { error?: string; message?: string } | null;
export type ForumFilters = { q: string; category: string; mine: boolean; page: number };
export type ForumQuery = Record<string, string | string[] | undefined>;
export const forumFilterSchema = z.object({
  q: z.string().trim().max(100).default(""), category: z.union([forumCategorySchema, z.literal("")]).default(""),
  mine: z.enum(["1", ""]).default("").transform(value => value === "1"),
  page: z.string().regex(/^[1-9]\d{0,4}$/).default("1").transform(Number),
});

export function forumUrl(filters: Partial<ForumFilters>) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.category) query.set("category", filters.category);
  if (filters.mine) query.set("mine", "1");
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  return `/forum${query.size ? `?${query}` : ""}`;
}

// Quote PostgREST filter values so punctuation cannot become filter syntax.
// Escape LIKE wildcards so a search for '%' or '_' searches those characters.
export function forumSearchFilter(q: string) {
  const pattern = JSON.stringify(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
  return `title.ilike.${pattern},body.ilike.${pattern}`;
}

type Author = { display_name: string };
export type ForumPost = {
  id: string; author_id: string; title: string; category: keyof typeof forumCategories; body: string;
  created_at: string; updated_at: string; author: Author | Author[] | null;
  forum_comments: { count: number } | { count: number }[] | null;
};
export type ForumComment = {
  id: string; author_id: string; body: string; created_at: string; author: Author | Author[] | null;
};
