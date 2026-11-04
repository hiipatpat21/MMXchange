# MMXchange manual test plan (Prompt 12)

Leave PASS/FAIL cells blank until actually executed. Use disposable accounts, separate browser profiles/private windows, and Philippine time for all scheduling. The SQL Editor security test is independent of these UI scenarios and rolls back its own fixtures.

## Setup

- Accounts A, B, C, D: four separate registered test users. Do not put real private information in test content.
- A teaches Graphic Design, wants Python. B teaches Python, wants Graphic Design. C teaches Python. D is an outsider/security observer.
- Apply all previous schema blocks and Prompt 12 hardening once. Keep email confirmation/delivery settings consistent with `docs/auth-setup.md`.
- SQL test: copy `supabase/tests/security-checks.sql`, replace USER_A_UUID/USER_B_UUID/USER_C_UUID with distinct existing profile UUIDs, and run the whole script. Activity IDs are generated; optional unused fixture UUID replacements are marked in comments. Expected summary: all PASS, then ROLLBACK. This has NOT yet been executed against hosted Supabase.
- Local checks: `node scripts/audit-security.mjs`, `node scripts/test-security.mjs`, `node scripts/test-messaging.mjs`, `node scripts/test-feedback.mjs`, `node scripts/test-forum.mjs`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Scenario A: match → exchange → review

| Step | Action | Expected result | PASS/FAIL |
| --- | --- | --- | --- |
| A1 | Log in as A; open Discover. | B is mutual and ranked above one-way C; overlap explanation names real skills. | |
| A2 | Search/filter students; open B's profile. | URL filters work; profile has no email/verification claim; no fake reviews. | |
| A3 | A requests an exchange with B with Python to learn and Graphic Design offered. | One pending request, B gets notification, details private to A/B. | |
| A4 | Try another active request for A/B, including opposite direction. | Rejected without duplicate active exchange. | |
| A5 | B accepts. A/B exchange messages; refresh B's inbox and open the thread. | Acceptance notification, message notification, unread dot clears when thread opens. Notification opens its actual Messages route. | |
| A6 | Schedule one future teaching slot in each direction, with a practical start a few minutes away. | Slots use agreed teachers/skills; Philippine time displayed; partner notified. Past dates rejected. | |
| A7 | After a slot starts, A confirms completion; then reschedule/add a future slot before B confirms. | Confirmations reset; exchange is not prematurely completed. | |
| A8 | After a non-cancelled slot starts, both A/B confirm completion again. | Exchange becomes completed only after both confirmations. | |
| A9 | A and B each submit a rating and optional comment once. | Thank-you message, each user's final progress step reflects their own review; reviewee receives New review notification. | |
| A10 | Resubmit from a stale tab/direct RPC; open received reviews on profiles. | Duplicate rejected; summaries count once; latest five and university disclaimer displayed. | |
| A11 | Use another pending test request to test recipient decline and requester cancel. | Valid actors can respond; messaging closes for declined/cancelled exchanges. | |

## Scenario B: group lifecycle and capacity

Use separate sessions for cancellation and completion; cancelled sessions cannot be reused as completed fixtures.

| Step | Action | Expected result | PASS/FAIL |
| --- | --- | --- | --- |
| B1 | C creates a future published session with capacity 1. | Browse/details/organized list show it; cannot create in the past. | |
| B2 | **Last-seat race:** open A/B in separate browsers, refresh both, and click Register as simultaneously as possible. | Exactly one succeeds; the other sees full. C sees exactly one registration; count never exceeds 1. | |
| B3 | Winner attempts to register again through stale form/RPC. | already_registered; no duplicate row or notification. | |
| B4 | Loser refreshes browse/detail; C tries reducing capacity below registered count. | Full state accurate; reducing below count rejected. | |
| B5 | Winner cancels registration before start; loser registers. | Seat reopens, counts/my-registered lists update correctly. | |
| B6 | C edits date/time, venue/meeting details, format, or registration deadline. | Registered learner gets details-updated notification; new Philippine time is consistent across pages. | |
| B7 | C posts an announcement. Compare registered learner and D. | Learner receives notification and sees announcement; D sees neither feed nor form. | |
| B8 | D attempts to post; C cancels this session. | D rejected; cancellation notifies registered learner and disables registration/posting. Existing attendees may read old announcements. | |
| B9 | C creates a separate session with future registration deadline and capacity 2; A and B register. | Two registrations, correct seat count. Direct insert into registrations remains denied. | |
| B10 | Let deadline pass before start; D tries to register. | Closed; no registration row. | |
| B11 | After start, C completes the session. | Completed status, learners notified about feedback availability; no premature completion. | |
| B12 | A/B submit stars, helpful yes/no, optional comment. | Thank-you, average/count/recent comments update, disclaimer visible. Duplicate feedback rejected. | |
| B13 | C and unregistered D try to submit feedback through RPC. | Organizer/unregistered rejections; no new feedback rows. | |
| B14 | Check organized/registered/browse filters after completion/cancellation. | Statuses, counts and lists reflect each real lifecycle. | |

## Scenario C: six required security checks

Use the ordinary signed-in client/public key for direct API attempts. Do not test with the SQL Editor's default privileged identity; use the rollback SQL harness for SQL tests.

| Step | Action | Expected result | PASS/FAIL |
| --- | --- | --- | --- |
| C1: profile edit | A tries updating B's profile through API; edits own profile normally; tries changing own created_at. | B unchanged; own supported fields save; created_at update denied. | |
| C2: private exchange | D opens A/B's exchange URL and selects it through API. | Page 404; API returns no private rows. | |
| C3: private conversation | D opens A/B's Messages URL, selects/inserts messages, or marks it read through RPC. | 404/no rows/write rejection; A/B history stays private. | |
| C4: other organizer | A attempts direct UPDATE and update_group_session for C's session. | Rejected; actual session fields unchanged. | |
| C5: duplicate registration | A registers twice and tries direct registration INSERT. | Only one RPC registration; duplicate code; direct INSERT denied. | |
| C6: unauthorized feedback | D reviews A/B's exchange; D gives feedback on a session D never registered for; A reviews an incomplete exchange. | All rejected; no review/feedback rows created. | |

## Scenario D: additional privacy/auth/forum checks

| Step | Action | Expected result | PASS/FAIL |
| --- | --- | --- | --- |
| D1 | A reads/updates B's notifications or reports; attempts forged reporter ID. | No private rows visible/mutable; forged insert rejected. | |
| D2 | A uploads a valid avatar, then attempts another user's folder and oversized/unsupported files. | Own valid photo saves; foreign folder/type/size rejected. Public image link is intentionally accessible. | |
| D3 | A creates forum post, B replies/reports, D attempts to delete A's post/B's reply. | Reply count and author notification; report private; other-author delete returns no rows and does not remove content. | |
| D4 | Open Forum/Messages notifications from bell and full list. | Correct local detail destination, marked read; no external redirect accepted. | |
| D5 | Log out and open every protected root and nested detail/new/edit route. | Redirect to login; actions independently reject unsigned callers. Removed /test-supabase returns 404. | |
| D6 | Request reset for known/unknown emails; open a delivered reset link in the same browser; submit matching new passwords. | Identical neutral request message; valid recovery succeeds; old/invalid/reset-less session cannot use the app recovery screen. SMTP eligibility/rate limits may require setup. | |
| D7 | Try disallowed email domain via app registration if configured. | App rejects it; do not treat this convenience filter as global Supabase Auth enforcement or MMSU verification. | |
| D8 | Add/remove skills; attempt invalid skill ID, duplicate, expired login, and stale removal. | Friendly errors and pending state; no raw database messages or silent success. | |

## Responsive/accessibility checks

| Step | Action | Expected result | PASS/FAIL |
| --- | --- | --- | --- |
| R1 | Browse all routes at 375px, 768px and 1280px, using long names/messages/posts. | No page-level horizontal overflow; cards/controls wrap; content remains readable. | |
| R2 | Use keyboard only: skip link, sidebar/mobile sheet, menus, forms, details, radio ratings. | Visible focus, logical order, labelled controls, no keyboard trap. | |
| R3 | Submit invalid forms; observe loading/error/empty lists with a slow connection. | Errors announced with role=alert; helpful loading/empty states; no false empty list on query failure. | |
| R4 | Check gold badges, status text, and icon buttons. | Readable contrast, accessible button names, at least 40px tap targets. | |
| R5 | Enable reduced motion and zoom text to 200%. | Essential controls usable; decorative motion suppressed; no hidden form actions. | |
| R6 | Run Lighthouse accessibility (or available equivalent) in the actual browser. Record route, viewport, date and score separately. | Actual results recorded; no invented score. | |

If a SQL check reports FAIL, record its test name and SQLSTATE/detail, stop treating the feature as verified, and investigate the deployed grants/policies. Fixture/preflight errors mean the SQL checks did not run. The sequential SQL last-seat check confirms the rule; B2 is the separate real concurrency test.
