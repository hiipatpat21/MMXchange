# Prompt 9: reviews, feedback and reporting

Apply only the new **Prompt 9** SQL block appended to `supabase/schema.sql`. Earlier exchange, session, and notification SQL must already be applied. No packages or environment variables are added.

## Local checks

Run `node scripts/test-feedback.mjs`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
The Node script mocks Supabase to check validation, server-derived report authorship, RPC arguments, rejection messages, cache invalidation, summary formatting, and progress. It does not execute database functions or policies.

## Live tests with A, B, and C

1. Create an exchange between A and B. Before completing it, try the `submit_exchange_review` RPC as A: expect `not_completed`. C must receive `not_allowed` for that exchange.
2. Complete the exchange normally: schedule a session, wait until its start, and have both students confirm completion. A and B should each see their own review form.
3. Submit A's rating with an optional comment. Expect **Thanks for your feedback**, the final progress step checked, and a **New review** notification for B linked to the exchange. B's final step must remain incomplete until B reviews.
4. Submit B's review. Each student's public profile should show the rating they received, not the rating they gave. Their most recent five reviews appear with the university disclaimer. An account with no received reviews shows **No reviews yet**.
5. Submit A's review again through the RPC (or two tabs simultaneously): one row per reviewer is retained; duplicates return `already_reviewed`; no duplicate review notification is created. The browser action should show a friendly rejection from a stale form.
6. Make A the organizer of a group session and register B. Let the session start and have A mark it completed. B should see stars, a required helpful Yes/No question, and an optional comment. A and unregistered C should see the public summaries but no feedback form.
7. B submits feedback. Expect **Thanks for your feedback** and the session's average/count and recent feedback to update. A direct second submission returns `already_submitted`; C receives `not_registered`; A receives `is_organizer`.
8. Invalid ratings (0, 6, fractional), missing helpful answer, and comments over 500 characters must be rejected. Blank optional comments are saved as null. Direct inserts/updates/deletes on the two feedback tables are denied to ordinary accounts; only submission functions can write.
9. Open **Report** on a profile review or a session feedback item. Submit a 5–500 character reason. Expect confirmation. As developer, open **Supabase → Table Editor → reports**: the row has status `open`, the logged-in reporter's ID, target type/key, and reason. There is no admin UI or automatic removal. You may set status to `reviewed` or `dismissed` there after reviewing it.
10. Through an ordinary authenticated client, A may select A's reports but cannot select B's reports, insert using B's ID, insert a report already marked `reviewed`, or update/delete any report. Logged-out clients cannot read reviews, feedback, or reports.
11. Check keyboard-only star selection (Tab, arrow keys, Space), helpful radio labels, report expansion, visible focus, and wrapping at 375px. Every review section includes: **Reviews reflect individual student experiences and are not official university endorsements.**

## Target IDs and visibility

- Exchange review reports use the review UUID.
- Session feedback has a composite primary key, so report `target_id` is `session UUID:student UUID`.
- `session`, `forum_post`, and `forum_comment` report types are reserved for reusable controls; no unfinished forum controls are shown.
- Ratings/comments are readable by any logged-in student. They do not grant access to the underlying private exchange. Reports are private to their reporter in the app/API; the developer can inspect them in the Table Editor.
- Group feedback eligibility uses the registration record; the app does not verify attendance.
- Reviews and feedback are submitted once and cannot be edited/deleted by students. Reporting does not hide them automatically.

## Common errors

- Missing table/function or permission errors: apply the complete Prompt 9 block after earlier phases.
- Form missing: the activity is incomplete, the current student is ineligible, or they already submitted.
- **Could not check your feedback status**: a database query failed; reload after fixing setup rather than assuming no review exists.
- A report does not appear for another account: expected privacy behavior. Review it through the developer's Table Editor.
