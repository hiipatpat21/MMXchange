# MMXchange redesign

The dashboard's question is **What should I do next?** It now shows four blocks instead of ten: one suggested action, incoming requests, the next three learning activities, and up to two matching people. The combined agenda reads existing exchange/group data; those workflows and database tables remain separate. Skills, notifications, hosted sessions and all other information remain accessible on their dedicated pages.

## Direction and decisions

Applied the explicitly requested [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), installed as `design-taste-frontend` in the local Codex skills directory. Direction: **Editorial greeting**, seed **619307317**, open-plane shell, with brand palette/type kept. No redraws. Existing MMSU green/gold, system/SF font stack and logo remain.

The product's face comes from a quiet green-tinted ground, real student identities, and paired **You share / You learn** skill summaries. The distinctive object is the reciprocal exchange; it is not represented by invented statistics or a chart. A personal greeting leads the dashboard; other screens have clear task titles. The interactive substance is the actual matching/filtering, exchange requests, registration, messaging and forum workflows.

The app uses a 12-column grid with 16px gaps. At 1100px inner width, 12 × 77 + 11 × 16 = 1100. Tablet panels use 6/6 spans to avoid cramped narrow side panels; wide desktop uses 8/4 followed by 6/6. At phone widths panels stack in priority order. Touch controls remain at least 44px instead of adopting the skill's smaller desktop defaults. Existing notification/account controls are retained in a quieter utility bar.

## Questions by area

| Area | First question answered | Change |
| --- | --- | --- |
| Dashboard | What should I do next? | Four short panels; one action leads; setup is one inline suggestion. |
| Discover | Who could I learn with? | Matches and everyone browsing have separate URL views; skill breakdowns open on demand. |
| Sessions | What can I join? | Two-column previews, search first, advanced filters expandable, clear Joining/Hosting tabs. |
| Exchanges | Where does my swap stand? | Paired skill summaries, next action visible, full progress expandable. Original request stays open for a recipient reviewing it. |
| Detail pages | What do I need for this activity? | Essential status/time/actions first; preparation, requirements and participant names expandable. |
| Messages | Who am I talking with? | Concise header; existing unread previews, private threads and Refresh preserved. |
| Forum | What are students asking? | Shorter excerpts and clearer discussion action. Full content remains on the thread. |
| Notifications | What changed? | Quiet reading list, clear unread state, existing read actions preserved. |
| Profile/skills | What do I want others to know? | Grouped form fields; optional photo editor folded away; distinct teach/learn lists. |
| Reviews | How was the learning experience? | Rating and disclaimer stay visible; recent comments expand. Eligibility forms and query errors stay visible. |
| Landing/authentication | Is this for me, and how do I start? | One learning illustration, concise copy and clear actions; auth artwork is hidden on small screens. |

## Generated illustration

Asset: `public/learning-together.webp` — fictional students sharing drawing, coding and music. Built-in image generation was used; it is an illustration, not a photograph of real MMSU students or an official university graphic. Original generated PNG remains in the Codex generated-images directory. The project asset was resized/encoded as a 1200 × 900 WebP (181,764 bytes) using the already-installed Sharp dependency. No package was added.

The image is used on the landing page and the desktop authentication layout. It is intentionally absent from the dashboard and other task-focused screens. One explanatory image serves the brief better than adding decorative pictures to reach an arbitrary image count.

Final generation prompt:

> Create a polished editorial raster illustration for the public landing page of MMXchange, a student project for learning skills together. Landscape 4:3 composition. Three friendly college-age fictional students at a shared table: one showing a small drawing in a sketchbook, one sharing a laptop with a simple abstract code-like pattern (no readable text), another practising a guitar beside them. Communicate reciprocal peer learning rather than a teacher lecturing a class. Modern hand-painted cut-paper / gouache editorial style with tactile paper texture, confident simple silhouettes, expressive natural poses, sophisticated airy composition, not clip art, not 3D, no generic decorative floating shapes. Dominant deep green #0c4b05, gold #ffb800, white and restrained neutral charcoal and warm paper tones. Pale nearly white solid background and generous breathing room around the scene. No text, no letters, no logo, no campus architecture, no school insignia, no claims of official affiliation. Visually engaging and warm but calm, clear even when displayed at 500px wide.

## Verification scope

- Production build, TypeScript, ESLint, existing security/messaging/feedback/forum mock regression scripts.
- Taste inspector screenshots at 1440, 768 and 390 for the production landing/login pages and isolated dashboard fixtures. Reports/screenshots live in ignored `.taste-skill/` directories.
- The initial protected-dashboard inspection reached **login**, because the inspector creates an unauthenticated browser. It is not a before-dashboard screenshot and must not be reported as one.
- `scripts/preview-redesign.mjs` renders actual dashboard components with an isolated mocked data layer in populated/empty/error states. Fictional Lia/Ren data is only in that script; never imported into the app. This verifies presentation, not Supabase authorization, live queries or authenticated menus.
- For privacy and accuracy, no credentials were copied from another browser, no accounts were created, and no real messages/registrations/reviews were submitted.
- Production public/login inspection reported 0 FAIL. Retained warnings: a public landing headline is intentionally larger than an app title; the authentication form is deliberately centred in its half of a two-column layout. These are not hidden by disabling checks.
- Populated, empty and error dashboard fixture inspections each reported 0 FAIL and 0 WARN at all three widths. These are presentation checks with fictional sample data, not proof of live database access or successful mutations.
- Source taste lint has a false positive: the existing Sheet animation class `slide-in-from-bottom-10` is interpreted as a gradient. It is a slide animation, not a gradient fill. Overlay shadows, input focus rings, the unused monospace token and loading-only pulses are intentional. Runtime render checks are used to judge the result.

### Visual critique

The first review found narrow tablet side panels, excessive request-footer spacing, and an image that did not arrive promptly in the first screenshot. The final changes widen tablet panels, combine the request counts/footer and serve a pre-encoded illustration eagerly. The dashboard now reads as four distinct answers with one primary action; no vanity metrics or decorative charts were added. Short/empty panels keep their natural height rather than padding them with fake content to force matching heights. On phones the navigation folds away and the next action leads. The visual fixture omits live account/menu behaviour; those controls require an authenticated browser check.

## Manual acceptance checks

1. With one account, open the dashboard at 375px, 768px and desktop width. Expect four main panels, one primary next action, no horizontal page scroll, and a working mobile menu.
2. With two accounts that have a pending exchange, verify the recipient sees the original request open, can review/respond, and can open full progress and preparation notes.
3. On Discover switch Your matches/Browse everyone. Search and submit advanced filters; active advanced filters should remain expanded and Clear filters should stay in browsing.
4. Browse/join/host a group session. Expand requirements, learning objectives and the organizer's participant list. Essential times, seats and registration controls must stay visible.
5. Open Messages, Forum, Notifications, both profile pages and Skills. Existing links, refresh, report, add/remove, save and read actions must still work.
6. On completed activities, keep rating forms visible for eligible students; expand reviews and verify the disclaimer and Report controls.
7. Check landing, login, register and recovery routes logged out. The illustration should load quickly; mobile forms should not have a large decorative image before them. Keyboard focus, labels, error announcements and reduced-motion behaviour should remain usable.

No new SQL or runtime services are required. Existing Supabase errors still need the earlier schema blocks; this redesign does not apply database migrations. Live authenticated click-through and Supabase RLS checks remain separate from the visual fixture review.

## Changed files

- `.gitignore` ? Ignores local direction sheets and inspection artifacts.
- `app/(app)/dashboard/page.tsx` ? Simplifies dashboard content and its reading priority.
- `app/(app)/discover/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/exchanges/[id]/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/exchanges/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/forum/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/layout.tsx` ? Updates navigation, shell or authentication layout.
- `app/(app)/messages/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/notifications/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/profile/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/sessions/[id]/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/sessions/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(app)/skills/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(auth)/layout.tsx` ? Updates navigation, shell or authentication layout.
- `app/(auth)/login/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(auth)/register/page.tsx` ? Updates page hierarchy, section density or progressive disclosure.
- `app/(public)/layout.tsx` ? Refreshes the public learning story and illustration layout.
- `app/globals.css` ? Shared palette, typography, spacing, panels, disclosures and responsive grid.
- `components/dashboard/dashboard-section.tsx` ? Simplifies dashboard content and its reading priority.
- `components/dashboard/greeting.tsx` ? Simplifies dashboard content and its reading priority.
- `components/dashboard/learning-agenda.tsx` ? Combines upcoming exchange, joined and hosted activities for the home preview.
- `components/dashboard/pending-requests.tsx` ? Simplifies dashboard content and its reading priority.
- `components/dashboard/profile-checklist.tsx` ? Simplifies dashboard content and its reading priority.
- `components/dashboard/recommended-matches.tsx` ? Simplifies dashboard content and its reading priority.
- `components/dashboard/suggested-next-step.tsx` ? Simplifies dashboard content and its reading priority.
- `components/exchanges/exchange-card.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/exchanges/exchange-progress.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/exchanges/status-badge.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/feedback/profile-reviews.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/feedback/session-feedback.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/forum/post-card.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/landing/hero.tsx` ? Refreshes the public learning story and illustration layout.
- `components/landing/how-it-works.tsx` ? Refreshes the public learning story and illustration layout.
- `components/landing/two-ways.tsx` ? Refreshes the public learning story and illustration layout.
- `components/layout/nav-links.tsx` ? Updates navigation, shell or authentication layout.
- `components/layout/page-intro.tsx` ? Consistent title, description and page actions.
- `components/layout/sidebar.tsx` ? Updates navigation, shell or authentication layout.
- `components/layout/topbar.tsx` ? Updates navigation, shell or authentication layout.
- `components/profile/profile-form.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/sessions/session-card.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/sessions/session-filters.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/sessions/session-status-badge.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/sessions/session-tabs.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/students/match-card.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/students/student-card.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/students/student-filters.tsx` ? Simplifies feature previews, forms, status or optional details.
- `components/ui/badge.tsx` ? Applies shared control and surface styling across routes.
- `components/ui/button.tsx` ? Applies shared control and surface styling across routes.
- `components/ui/card.tsx` ? Applies shared control and surface styling across routes.
- `docs/redesign.md` ? Direction, image prompt, critique, limitations, file inventory and acceptance checks.
- `public/learning-together.webp` ? Generated, optimized peer-learning illustration.
- `scripts/preview-redesign.mjs` ? Isolated populated, empty and error layout fixtures; no live database.
