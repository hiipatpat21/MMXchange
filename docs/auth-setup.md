# Prompt 7: recovery and profile photos

## Environment

Keep existing Supabase values in `.env.local`. Add:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAINS=
```

Restart `npm run dev` after changing environment variables. In Vercel, set
`NEXT_PUBLIC_SITE_URL` to the HTTPS production origin for Production and the
appropriate origin for Preview. Localhost is a development-only fallback;
production recovery requires an explicit HTTPS origin.

Leave `ALLOWED_EMAIL_DOMAINS` empty to allow all addresses. Otherwise supply
comma-separated domain names, without `@`, such as `example.org,example.net`.
Matching is exact and case-insensitive; list subdomains separately. No MMSU
domain is assumed. This check applies to the app's register server action;
it does not restrict direct calls to Supabase Auth's public signup API.
Project-wide enforcement would need an Auth hook. It is not student verification.

## Supabase setup

1. Run only the `-- Prompt 7` block appended to `supabase/schema.sql`.
2. In Authentication > URL Configuration, set Site URL to the app origin.
3. Add `http://localhost:3000/auth/callback**` and
   `https://YOUR-PRODUCTION-HOST/auth/callback**` to Redirect URLs. The narrow
   callback pattern accommodates `next` and the SDK's PKCE flow query parameters.
   For a different local port, use that port in both the environment and allowlist.
4. Keep the standard reset-email confirmation link (`{{ .ConfirmationURL }}`).
   A custom template that uses a different callback mechanism must be adapted
   separately; this implementation consumes a PKCE `code`.
5. Verify Storage > avatars is public, limited to 2 MB, and permits only
   `image/jpeg`, `image/png`, and `image/webp`. The SQL sets those limits.

The [redirect configuration guide](https://supabase.com/docs/guides/auth/redirect-urls)
explains allowlists. The [PKCE guide](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
explains why the browser requesting the reset must also open the email link.

## Email delivery

Supabase's built-in sender currently permits **two emails per hour per project**
and delivers only to addresses on the project's organization team. There is also
a default 60-second interval between reset requests for the same user. See the
[SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp) and
[rate limits](https://supabase.com/docs/guides/auth/rate-limits).

For the demo, test with an existing app account whose email is also an authorized
team address. Other recipients require an appropriately configured SMTP provider
within the project's free-tier constraint; this task adds no email service.
The UI intentionally returns the same message for registered addresses,
unregistered addresses, rate limits, and delivery failures.

## Behavior and checks

- A successful recovery-code exchange sets an HTTP-only, SameSite=Lax marker for
  15 minutes, bound to the authenticated user's verified JWT session ID.
- Normal sign-in, sign-out, and successful reset clear that marker. A refreshed
  access token retains its session ID. The page and action both check the marker;
  Supabase authentication authorizes the actual password update for the user.
- The callback validates `next` as a local path. Reset destinations require a
  recovery flow; changing a query parameter does not enable the reset screen.
- Photos are optional and publicly readable by image link. Uploads use unique
  names under the signed-in user's folder. Storage RLS enforces folder ownership;
  bucket limits enforce MIME type and size. The save action checks metadata and
  computes the URL, and AvatarImage falls back to initials on image failure.
- Replacing a photo leaves the older file in Storage. Old unreferenced files may
  be cleaned up manually; the app does not delete earlier photos automatically.

Use account A with email access and account B for ownership tests:

1. Logged out, request A's reset link, open it in the same browser, and choose a
   new matching password of at least 8 characters. Expect the dashboard; sign out
   and confirm the new password works.
2. Request a link for an unregistered address. Expect the identical neutral message.
3. Open `/reset-password` without a recovery callback, including while normally
   logged in. Expect an explanatory notice, not a password form.
4. Try an expired/reused code and external/encoded `next` destinations. Expect a
   safe in-app result and no external redirect.
5. Upload a JPG below 2 MB on A's profile. Expect it on the profile, top bar,
   Discover cards, recommendations, and student profile. No photo remains complete.
6. Try a 5 MB image, PDF, empty file, another user's folder, and a forged photo
   URL/path. Expect rejection; B's profile must remain unchanged.
7. Temporarily configure allowed domains in development, restart, and try an
   allowed and disallowed registration through the app. Clear the setting afterward.

The SQL, actual email delivery, Storage ownership, and live browser workflows must
be verified in the developer's Supabase project. Local validation can cover
actions with mocked clients, redirects, metadata checks, types, lint, and build.
