# Prompt 8: messaging and announcements

Run the new **Prompt 8** block at the end of `supabase/schema.sql` in the Supabase SQL Editor. It depends on the previous exchange, session and notification SQL. No new environment variables or packages are needed.

Updates use a visible **Refresh** button; Realtime is not enabled. Messages load 50 at a time, announcements 20 at a time, with links for older entries. Conversations load 30 at a time. Message history stays readable to participants after cancellation or decline, but sending stops and the conversation leaves the inbox.

## Local checks

1. `node scripts/test-messaging.mjs` — mocked Server Action checks for invalid input, authentication, server-derived authorship, denied writes, and receipt calls. This does not test database policies.
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run build`

## Live tests (three accounts: A, B and C)

1. Have A request a valid exchange with B. Open **Messages** as A and B: the conversation is listed, even before the first message. C must not see it.
2. A sends a message. B refreshes `/messages`: the preview and Philippine timestamp appear, with an unread dot. Open the thread, then return to the list: the dot clears. A's messages align right for A and left for B.
3. A sends several more messages while B stays outside the thread. B receives one unread **New message** notification for this exchange. Mark that notification read and send again: a new notification is allowed. Opening a thread clears the conversation dot; notification read state is managed separately through the notification controls.
4. Copy `/messages/<exchange-id>` into C's browser: 404. A logged-out browser redirects to login.
5. Submit a blank/whitespace message or bypass `maxLength` to submit 3,000 characters: rejected. Cancel or decline the exchange and attempt to send from an already-open tab: rejected. Refresh the thread: history remains, with a closed message instead of the form.
6. Make A the organizer of a published group session and register B. A posts an announcement: A and B see it after refresh; B gets a notification; C sees neither the announcement feed nor a notification. B has no Post form.
7. Cancel or complete the group session. Attempt a post from an older tab: rejected. Registered students can still read previous announcements. Cancel B's registration before a future session: B then loses access to the feed.
8. Add more than 50 messages and 20 announcements. Follow **Older** and **Latest** links: no skipped/duplicated boundary entries. Opening older messages must not clear the unread dot for newer messages.
9. At 375px width and with keyboard navigation, long unbroken messages wrap, controls remain accessible, and each textarea has a visible label.

## Direct API security checks

Using each account's normal authenticated browser client (no privileged key), attempt:

- C selecting/inserting `exchange_messages` for A/B's exchange: no rows visible / insert rejected.
- A inserting a message with `sender_id = B`: rejected.
- B inserting a `session_announcements` row for A's session: rejected.
- C selecting the announcements: no rows visible.
- C inserting a receipt for A's exchange, or reading B's receipts: rejected / no rows visible.
- Updating/deleting an existing message or announcement: rejected. These are append-only feeds.

The triggers lock the parent exchange/session while checking status, so concurrent cancellation cannot permit a later send/post. They also generate notifications. The read-receipt function only advances a user's own receipt; a message arriving after the loaded timestamp remains unread.

## Common setup problems

- Missing table/function or permission errors: the Prompt 8 SQL was not fully applied, or earlier SQL is missing.
- No announcement form: only the organizer of a **published** session can post.
- No conversation in the inbox: only pending, accepted, scheduled and completed exchanges appear.
- Another browser does not update immediately: click **Refresh**; there is no Realtime subscription.
- Notification exists but a feed is inaccessible: access may have ended after registration cancellation. A notification never grants access.
