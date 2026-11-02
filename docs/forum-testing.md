# Prompt 10: learning forum

Apply only the new **Prompt 10** block at the end of `supabase/schema.sql`. Previous notification and reporting SQL must already be applied. `/forum` was already present in `proxy.ts`'s protected paths. No new packages, environment variables, or services are needed.

## Automated checks

Run:

1. `node scripts/test-forum.mjs`
2. `node scripts/test-feedback.mjs`
3. `npx tsc --noEmit`
4. `npm run lint`
5. `npm run build`

The Node scripts mock Supabase. They check validation, server-derived identities, deletion rejection/no-op handling, invalid filters, literal search escaping, pagination URLs, and forum report routing. They do not execute RLS, notification triggers, or live search queries.

## Manual tests (accounts A, B and C)

1. As A, create a learning question with a category and multiple paragraphs. Expect a redirect to the post; A sees **Delete post**, and B sees **Report**. The forum card shows category, author, Philippine timestamp, excerpt, and zero replies.
2. As B, add a reply. Expect the reply, a count of one on the forum card, and A's **New reply to your post** notification linking to the post. A replying to their own post must not create a self-notification.
3. Search text appearing only in the title, then text appearing only in the body. Both searches should find the post, case-insensitively. Try punctuation such as `C++`, `%`, `_`, commas, and quotes: no query errors, wildcard expansion, or filter injection. `%` and `_` are literal search characters.
4. Choose category chips, combine a search with a category, and check **My posts → Apply filters**. The URL reflects filters; category/page links preserve them. Clearing filters restores all posts.
5. Create more than 20 posts and 30 replies across test accounts if testing pagination. Posts show 20 per page (newest first); replies show 30 per page (oldest first). Next/Previous links work. Use **Last page** to see new replies in a long thread.
6. Blank/whitespace replies, replies over 2,000 characters, short titles, invalid categories, and posts over 5,000 characters must be rejected. Invalid UUIDs and a random nonexistent post UUID show 404. Invalid list filters offer Reset filters.
7. A can expand **Delete post** and explicitly confirm; the post and all replies disappear, and A returns to the forum. B can delete B's reply but cannot delete A's reply or post. A does not gain permission to delete B's individual reply merely by owning its parent post.
8. As B, report A's post or reply with a 5–500 character reason. Expect confirmation and an `open` row in **Supabase → Table Editor → reports**, with the matching `forum_post`/`forum_comment` type and content UUID. Reporting does not hide content. A/C cannot read B's reports through the API.
9. Put text resembling HTML or JavaScript in a post/reply, for example `<strong>example</strong>`. It must display as text. Do not put real personal information into test posts.
10. Log out and open `/forum`, `/forum/new`, and a post URL: expect login redirects. At 375px, long words wrap and controls remain accessible. Use a keyboard to search, change categories, post, expand Report/Delete, and submit forms; focus should remain visible.

## Direct API ownership checks

Use B's ordinary authenticated Supabase client and the UUIDs of A's test post/reply:

```ts
await supabase.from("forum_posts").delete().eq("id", aPostId).select("id");
await supabase.from("forum_comments").delete().eq("id", aReplyId).select("id");
```

Expect no deleted rows; reload as A to verify the content still exists. Also verify:

- Updating A's title/body as B affects zero rows.
- Inserting content with A's `author_id` as B is rejected.
- Updating one's own content is permitted; changing author IDs, parent post IDs, or timestamps is rejected by column privileges.
- Anonymous clients cannot read or write either forum table.

## Behavior and common errors

- **Missing tables/permission errors:** apply the complete Prompt 10 SQL after earlier phases.
- **Could not delete:** content is already removed, or the signed-in account is not its author. A zero-row delete is treated as failure.
- **Could not post a reply:** the parent post may have been deleted while the form was open.
- **Old notification opens 404:** its referenced post was deleted; notification history does not grant access or preserve deleted content.
- Reports are reviewed manually in the developer's Table Editor. Their target IDs remain in reports if content is later deleted.
- The UI offers create, read, reply, report, and delete. Database policies also permit author content updates; an edit UI was outside this prompt.
