# Prompt 12 security audit

Scope: `lib/supabase/schema.sql` (original profiles, skills and group workflow), all of `supabase/schema.sql` (prompts 2–12), all Server Actions, auth callback/recovery helpers, browser upload code, route protection, and reachable Git history. This is a source audit; hosted grants/policies have not been read or tested. No claim of a complete penetration test or dependency audit is made.

## Findings, ranked

No confirmed critical/high cross-account data bypass was found in the checked-in policies and functions. Live checks remain mandatory.

| Severity | Finding | Resolution |
| --- | --- | --- |
| Medium: integrity | Profiles had table-wide UPDATE privileges: a student could change their own `created_at`, influencing newest-profile match ordering. Public text fields also lacked database length limits. | Restrict UPDATE to editable profile columns; append text CHECK limits. Existing rows are preserved with NOT VALID; see legacy data check below. |
| Medium: privacy/data validation | Direct Auth signup bypasses the app's Zod schema. The signup trigger accepted unlimited display-name metadata and fell back to the email prefix when missing. | Trigger trims/caps metadata and uses `Student` for missing/too-short names. Existing names are not rewritten. |
| Low: least privilege | Baseline SQL only added grants, so effective privileges could depend on Supabase default grants. `handle_new_user` had no explicit execute revoke. | Explicitly reset baseline grants and revoke external execution of the trigger-only function. Trigger functions cannot normally be used as ordinary RPCs; this is hardening, not a demonstrated takeover. |
| Low: integrity | Own read receipts allowed direct insert/update, including arbitrary future timestamps, bypassing the safer receipt RPC. This affected the caller's unread state only. | Remove direct receipt writes/policies; retain the ownership-checked RPC. |
| Low: error handling | Skill actions silently returned or logged raw database errors instead of telling the student they failed. | Friendly `useActionState` errors, pending states, and zero-row deletion detection. |
| Low: diagnostic exposure | Public `/test-supabase` displayed provider error messages. | Remove the diagnostic route. |
| Low: missing index | `group_sessions.skill_id` lacked a foreign-key index. | Append index. Other application FK lookup columns have a leading PK/index. |
| Correctness | Notification destination allowlist rejected the newly implemented Messages/Forum routes. | Permit only their exact local UUID routes alongside Exchanges/Sessions; external URLs remain blocked. |
| Low: provider errors | Signup returned the provider's raw error text. | Return a short generic signup error. |

## Effective application table access after Prompt 12

S/I/U/D mean SELECT/INSERT/UPDATE/DELETE. “RPC” means a checked function writes as its owner, not a direct student grant. No write policy uses unconditional `true`. Logged-in public reading intentionally uses `true` on public student content.

| Table | RLS | S policy | I policy/path | U policy/path | D policy/path | anon grants | authenticated grants | Visibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| skills | yes | everyone | manual management | manual management | manual management | S | S | Intentionally public catalog |
| profiles | yes | logged-in students | signup trigger | own row; editable columns | none | none | S, U editable fields | Public student fields only; no Auth email |
| profile_skills | yes | logged-in students | own profile | none | own profile | none | S,I,D | Public student skills |
| group_sessions | yes | logged-in students | own organizer, published, finite future start/deadline check | organizer RPCs only | none | none | S,I | Session details are public to signed-in students |
| group_session_registrations | yes | own rows or session organizer | registration RPC only | none | own, before session starts | none | S,D | Attendee identities restricted; counts via RPC |
| exchange_requests | yes | two participants | checked RPC | checked transition RPCs | none | none | S | Message/goals/meeting preferences private |
| exchange_sessions | yes | parent exchange participants | checked RPC | checked RPC | none | none | S | Private meeting details |
| notifications | yes | recipient | internal event helper | recipient, `read_at` only | none | none | S,U read_at | Recipient/content/link private |
| exchange_messages | yes | exchange participants | own sender, participant, allowed status; guard locks parent | none | none | none | S,I | Private message body |
| exchange_message_reads | yes | own rows | checked RPC only | checked RPC only | none | none | S | Private receipt timestamps |
| session_announcements | yes | organizer or registered student | own author, published session organizer; guard locks parent | none | none | none | S,I | Restricted announcements |
| exchange_reviews | yes | logged-in students | completed-participant RPC, partner derived | none | none | none | S | Public ratings/comments and reviewer/reviewee IDs; private exchange itself remains protected |
| group_session_feedback | yes | logged-in students | completed, registered non-organizer RPC | none | none | none | S | Public feedback; registration alone establishes eligibility |
| reports | yes | reporter | own reporter, status open | manual developer moderation | none | none | S,I | Reasons/reporter IDs private in app/API |
| forum_posts | yes | logged-in students | own author | own row; title/category/body only | own author | none | S,I,D,U content | Public to logged-in students |
| forum_comments | yes | logged-in students | own author | own row; body only | own author (parent delete also cascades) | none | S,I,D,U body | Public to logged-in students |

### Storage and system boundaries

- `storage.objects`: managed RLS is expected (as documented in the schema). Our policies grant SELECT only for the `avatars` bucket and I/U/D only under the current user's UUID folder. Project SQL grants anon S and authenticated S/I/U/D at table level; RLS is required and must be checked live. Other bucket policies are outside the checked-in schema.
- `storage.buckets`: managed table, configured through SQL Editor only; this project adds no client write grants/policies. Live system grants are not inferred from repository SQL.
- Public avatar photos are an **intentional exception** to “only skills should be public,” explicitly requested in Prompt 7. Anyone with the image link can view them. No private activity data belongs there. This audit does not silently change bucket privacy.
- `auth.users` is not exposed by app queries. Only its signup trigger and profile FK exist in the checked-in SQL. No app query selects Auth email addresses.

## Function audit

Every application security-definer function sets an empty `search_path` and schema-qualifies application tables. All externally callable mutation RPCs derive the actor from `auth.uid()`. Recipient/teacher/review target IDs are data, and are checked against the authenticated actor and parent records.

- Actor-checking RPCs: register_for_session, create_exchange_request, respond_to_exchange, schedule/reschedule/cancel_exchange_session, mark_exchange_complete, complete/update/cancel_group_session, mark_exchange_read, submit_exchange_review, submit_session_feedback.
- Trigger-only/internal functions (external execute revoked): handle_new_user, create_notification, notify_exchange_change, notify_exchange_session_change, notify_group_registration, notify_group_session_change, guard_exchange_message, notify_exchange_message, guard_session_announcement, notify_session_announcement, notify_exchange_review, notify_forum_reply.
- `registration_counts` intentionally returns aggregate counts without registration identities; authenticated execute only.
- Rating summaries and conversation listing are security **invoker**, so caller RLS still applies. Profile/session IDs there select public summaries, not authorization identities.
- Forum timestamp triggers are invoker functions with empty search paths and no external execute privileges. They mutate only the trigger row.
- Capacity registration, parent status changes, messaging guards and feedback eligibility use parent row locks. A single SQL transaction test cannot replace a real two-browser last-seat race.

## Server code and route audit

All data-changing business actions validate inputs with Zod and derive identity using server `auth.getUser()`, including calls delegated through the messaging/recovery helpers. No FormData/searchParams user ID authorizes a caller. IDs from forms identify the target resource; RLS/functions independently check permission.

Intentional exceptions: login/signup authenticate supplied credentials rather than requiring an existing user; reset-email requests are anonymous and neutral; logout takes no caller-controlled fields and signs out the current session. Zod is not applicable to logout's absent input. Password reset calls getUser via getRecoveryContext/getRecoveryBinding.

Authenticated route roots (including their child routes): `/dashboard`, `/discover`, `/students`, `/sessions`, `/exchanges`, `/messages`, `/forum`, `/notifications`, `/profile`, `/skills`. All `app/(app)` pages are covered. `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`, and the landing page are intentionally reachable outside that shell. Reset/callback have their own session/recovery checks. Server Action endpoints have authentication independently of proxy routing; hiding controls is not the authorization boundary.

React renders user text without dangerouslySetInnerHTML. Filter/UUID inputs are validated or passed through structured query arguments. Notification destinations are an exact route allowlist; auth redirects reject external/protocol-relative paths. Avatar images render only URLs from this project's public avatar bucket; uploads enforce own folders, MIME types and size at storage and save layers.

## Credentials/history scan

`node scripts/audit-security.mjs` scanned 86 reachable commits at audit time and non-ignored working-tree text files. No recognizable privileged Supabase key/JWT, private-key block, GitHub token or AWS access key was detected. `.env.local` is ignored, untracked, and absent from reachable Git path history. Local NEXT_PUBLIC assignments were checked privately for recognizable privileged keys; no values were printed and none were flagged. Only NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL occur as public variable names. The anon/publishable key is intentionally public and relies on RLS.

This is a heuristic, not a guarantee against arbitrary/unrecognized secrets or unreachable Git objects, remote branches not fetched, other ignored files, or dashboard-only settings. No privileged key is used by the app.

## Remaining live checks and documented limits

1. Apply the new Prompt 12 SQL, then run `supabase/tests/security-checks.sql` after replacing its account placeholders. It generates temporary activity IDs, reports PASS/FAIL, and ends in ROLLBACK. Fixture setup uses SQL Editor privileges; all adversarial calls switch to authenticated with explicit claims.
2. Run `docs/test-plan.md` using separate browser profiles, including last-seat concurrency, auth reset, avatar folder policies, and authenticated direct API ownership attempts.
3. Inspect live Storage RLS and the public avatar bucket. Unknown dashboard-only policies/grants cannot be ruled out by this source audit.
4. ALLOWED_EMAIL_DOMAINS is an app registration convenience, not global Auth enforcement. Public Auth signup bypasses it; use a properly configured Auth hook if strict global restriction later becomes a requirement. Accounts are not university verification.
5. The recovery marker is an unsigned, short-lived UI gate bound to the verified session, not proof of step-up authentication. A valid session can already change its own password through Supabase Auth. No cross-user password capability is added by that marker.
6. No application throttling/CAPTCHA or automatic moderation was added. Valid accounts can repeatedly post, message, or report within free-tier quotas. Reports require manual review.
7. Dependency vulnerability auditing, actual SMTP delivery, hosted auth configuration, and a live browser accessibility score are outside the completed local checks. There is no assertion that these passed.

### Legacy profile data

The new CHECK is NOT VALID to avoid rewriting existing public profiles. It still applies to new/updated rows. Inspect legacy rows locally in the SQL Editor (IDs only):

```sql
select id from public.profiles
where char_length(btrim(display_name)) not between 2 and 50
   or char_length(college) > 100 or char_length(program) > 100
   or char_length(bio) > 300 or char_length(avatar_url) > 500;
```

Have affected test users update their profile fields before validating the constraint. Old email-derived display names cannot be reliably distinguished from names deliberately chosen by students, so they are not mass-rewritten.
