# Illustrated visual refresh

## Latest refinement

Repeated section-introduction illustrations were removed at the user's request. Discover, Exchanges, Sessions, Messages, Forum, Notifications, Profile and Skills now use text-only introductions. The dashboard retains its single next-step illustration; public and authentication illustrations remain. Earlier measurements below describe the initial illustrated version where noted.

Login and registration now share a fixed starting position rather than vertically centering their different-height contents. The desktop illustration sits in an independent sticky viewport-height panel. The logo and form top stay aligned between routes, while longer forms can grow and scroll naturally. An authentication-only stable scrollbar gutter prevents sideways shifts when the longer page requires scrolling. The disclaimer stays at the bottom when space permits.

Files in this refinement:

- `components/layout/page-intro.tsx`: Removes repeated artwork and the unused scene prop.
- `app/(app)/discover/page.tsx`: Removes its scene selection.
- `app/(app)/exchanges/page.tsx`: Removes its scene selection.
- `app/(app)/sessions/page.tsx`: Removes its scene selection.
- `app/(app)/messages/page.tsx`: Removes its scene selection.
- `app/(app)/forum/page.tsx`: Removes its scene selection.
- `app/(auth)/layout.tsx`: Anchors the shared logo/form and illustration independently of form length.
- `app/globals.css`: Reserves consistent scrollbar space on authentication routes.
- `scripts/preview-redesign.mjs`: Updates the text-only introduction preview.
- `docs/visual-refresh.md`: Records this refinement and its checks.

Production transition check at 1440×900, 1440×600, 768×1024 and 375×812 found no change greater than 1px in logo, form-card or illustration starting positions when navigating from login to registration. Both pages had no horizontal overflow. No form was submitted. TypeScript, ESLint and the production build passed. Authentication forms and the text-only introduction were also inspected at desktop, tablet and phone widths.

## Direction and scope

The November 2026 refresh follows the supplied flat character reference. The public page uses **Colour chapters**, seed **2079289492**, and the app retains **Editorial greeting**, seed **619307317**. The idea is that MMXchange's two learning arrangements become two recognizable illustrated scenes: the pair exchanging skills and the group sharing a notebook. The existing logo artwork, routes, authentication, data loading and separate learning workflows are preserved.

The public page keeps short sage, white and soft-gold chapters rather than forcing 90vh sections or a photo mosaic without appropriate photographs. The existing three genuine sections are retained. The native getting-started accordion is the public interaction; it works without JavaScript. No decorative entrance animation was added because AGENTS.md explicitly prohibits decorative animation. The public inspector therefore allows `still-page` only; no other failing rule is suppressed. There is no authentic footage supplied for this student project, so the no-footage warning is retained. No stock photographs, invented testimonials, statistics or campus imagery are used.

The user specifically requested illustrations in authenticated pages. Small section introductions and the next-step panel therefore intentionally depart from the app skill's preference against illustrated welcome banners. They do not replace live student avatars or information about actual learning activities. The final requested art sizes are 112px on phones and 144px on larger section introductions, and 96px/112px in the dashboard suggestion. Headings retain their full width.

## Typography and logo

Plus Jakarta Sans by Tokotype is used for headings and body text. The original variable font and its SIL Open Font License are included locally, served with `next/font/local`; there are no runtime Google Fonts requests or new packages. Sources: https://tokotype.com/custom-fonts/plusjakarta and https://github.com/google/fonts/tree/main/ofl/plusjakartasans.

- Page titles: 28px on phones, 32px on larger screens, bold.
- Dashboard panel headings: 18px, bold; suggested activity: 20px/24px.
- Supporting text: 15px; captions previously at 12px now 14px.
- Main descriptions and form input text: 16px; landing introduction: 18px.
- Existing MMSU seal: 56px/64px display box, with larger MMXchange lettering. The source artwork is preserved; a 192px WebP copy reduces the file from about 817KB to 10KB and is loaded eagerly.
- The desktop sidebar hides its scrollbar using scoped CSS while retaining `overflow-y: auto`. Wheel, touchpad and focus scrolling remain available on short screens.

## Image assets and prompts

Generated using the built-in image tool with the user's attached illustration as a style reference, not an identity to copy. Original PNGs remain in the Codex generated-images directory. Optimized WebP files preserve transparency, total about 264KB. The previous `learning-together.webp` asset remains available but is no longer used by these layouts. Generated characters are fictional, not photographs of students or an official university mascot.

Shared prompt:

> Use case: illustration-story. Create an original website illustration for MMXchange, a peer-learning app for MMSU students. Input image 1 is a STYLE REFERENCE ONLY: follow its very simple flat vector-like character language: rounded expressive faces, black hair, small black eyes with white surrounds, warm peach skin with rosy cheeks, simplified rounded hands, confident solid color shapes, minimal coral contour lines, no texture, no gradients, no shadows, no 3D. Fictional college-age Filipino students, friendly and engaging. Clothing deep green #0c4b05, gold #ffb800, muted sage and slate neutrals. Transparent background with generous margin around complete silhouettes, no cropped heads or hands. No floating decorative shapes, no text, logos, badges, watermarks, campus buildings or university insignia. A polished coherent illustration family matching the reference, not a screenshot.

Individual scene prompts appended to the shared prompt:

- `public/illustrations/skill-exchange.webp`: Landscape 4:3 composition: two seated students sharing skills across a small table. A young woman in green shows a sketchbook drawing to a young man in gold who has a laptop open. Both engaged, smiling gently, reciprocal learning rather than lecture. Simple complete scene; visible upper bodies and table.
- `public/illustrations/group-learning.webp`: Landscape 4:3 composition: three students sitting close around a small shared table, one explaining a notebook to two others, laptop at side. Clear gestures, cheerful but calm, compact triangular arrangement, gender-diverse group with green, gold and muted sage clothing.
- `public/illustrations/curious-student.webp`: Square composition: one friendly young student with black hair, green short sleeve top, thoughtful gentle smile, one hand at chin like the style reference while the other holds an open gold-covered notebook. Half body fully visible with hands uncropped, looking slightly to the left, curious and optimistic rather than worried.

The generated results have subtle tonal shading despite the flat-style prompt. They were reviewed together for a consistent character family. No external image attribution is needed for these generated assets; the font license is retained with the font. Existing school artwork has not been regenerated.

## Files changed

- `app/layout.tsx`: Loads the local variable font across the application.
- `app/globals.css`: Shared palette, readable text sizes, white dashboard panels, colored public fields and hidden sidebar scrollbar.
- `app/(auth)/layout.tsx`: Displays the group-learning scene on desktop while keeping mobile forms first.
- `app/(public)/layout.tsx`: Aligns header and footer margins and accommodates the larger logo.
- `app/(app)/discover/page.tsx`: Selects the exchange scene for its introduction.
- `app/(app)/exchanges/page.tsx`: Selects the exchange scene for its introduction.
- `app/(app)/sessions/page.tsx`: Selects the group scene for its introduction.
- `app/(app)/messages/page.tsx`: Selects the exchange scene for its introduction.
- `app/(app)/forum/page.tsx`: Selects the group scene for its introduction.
- `components/ui/learning-illustration.tsx`: Typed reusable image component with intrinsic dimensions and decorative/meaningful alt handling.
- `components/ui/button.tsx`: Strengthens button text weight.
- `components/ui/card.tsx`: Enlarges card description text.
- `components/ui/input.tsx`: Keeps input text at 16px on desktop.
- `components/ui/textarea.tsx`: Keeps textarea text at 16px on desktop.
- `components/ui/label.tsx`: Strengthens form label weight.
- `components/layout/page-intro.tsx`: Adds larger contextual artwork without squeezing mobile headings or actions.
- `components/layout/logo.tsx`: Enlarges and eagerly loads an optimized copy of the existing seal.
- `components/layout/sidebar.tsx`: Scopes scrollbar hiding to the sidebar.
- `components/dashboard/dashboard-section.tsx`: Strengthens panel headings and empty-state copy.
- `components/dashboard/suggested-next-step.tsx`: Adds the curious-student scene with larger supporting text.
- `components/landing/hero.tsx`: Creates a sage illustrated opening with a prominent heading and real registration link.
- `components/landing/two-ways.tsx`: Illustrates and distinguishes the two existing learning modes.
- `components/landing/how-it-works.tsx`: Adds the gold getting-started chapter and native accordion.
- `scripts/preview-redesign.mjs`: Loads the real font in isolated fixtures and renders a shared introduction preview.
- `public/fonts/plus-jakarta-sans-variable.ttf`: Locally hosted variable font.
- `public/fonts/Plus-Jakarta-Sans-OFL.txt`: Font redistribution license.
- `public/mmsu-seal-display.webp`: Optimized existing seal artwork.
- `public/illustrations/skill-exchange.webp`: Generated exchange scene.
- `public/illustrations/group-learning.webp`: Generated group scene.
- `public/illustrations/curious-student.webp`: Generated curious-student scene.
- `docs/visual-refresh.md`: Direction, prompts, sources, verification and review notes.

Pre-existing AGENTS.md, .gitignore and untracked project setup files are not part of this refresh.

## Checks and limitations

TypeScript, ESLint and the production build are required. Taste source lint reports no failures; its warnings concern the existing loading skeleton pulse, unused monospace token and accessible input focus ring. These are intentional and not resting decoration.

Production public/login views and isolated populated, empty, error and section-introduction fixtures are inspected at desktop, tablet and phone widths. The fixtures use actual components with fictional Lia/Ren activity data, never imported into the live app. They verify presentation, not authentication, database authorization or mutation behavior. No credentials were copied or real activity submitted.

Natural dashboard panel heights are retained rather than padded with invented content. The inspector's ragged-row warnings reflect different real row counts; its panel-void warnings include space around 44px accessible link targets. The isolated introduction preview deliberately has no feed below it, explaining its blank-canvas warning. Login deliberately centers the form in its half of the screen, explaining its canvas warning.

## How to review

1. Logged out, open the landing page at 375px and desktop width. Expect a larger seal, loaded character artwork, readable text and no sideways page scrolling. Open each getting-started accordion item, then follow registration/login links.
2. With one ordinary account, visit Dashboard, Find a partner, Group sessions, Exchanges, Messages, Forum, Notifications, My profile and My skills. Expect larger headings, consistent palette and appropriately sized artwork; data and existing controls should still work.
3. On a short desktop window, scroll the sidebar with a wheel/trackpad and Tab to its last link. Expect no visible sidebar scrollbar and all destinations still reachable.
4. Use a second account only to review an existing request/conversation. Neither account should gain new permissions or see the other student's private activity.

If the old font or images appear, hard-refresh and restart the development server. If checking a production build, stop the old `next start` process before rebuilding and start it again afterward; an old process can reference CSS files from the previous build. No SQL or environment changes are required.

## Concepts

**Type hierarchy** uses size and weight to make the page's main point obvious. **Shared design tokens** let all sections use the same text scale and colors without separately styling every page. **Transparent optimized assets** let one illustration fit multiple backgrounds while keeping downloads small.

## Final verification results

- `npm run build`, `npx tsc --noEmit`, `npm run lint` and `git diff --check`: passed after the final application changes.
- Final production landing: 0 FAIL at 1440, 768, 390 and 375px, with the documented `still-page` allowance. Remaining warnings: no footage and a 17px measured visual-margin difference. All chapter wrappers use the same centered container and equal padding; the transparent illustrations have unequal internal negative space.
- Final production login: 0 FAIL at 1440, 768 and 390px, with the intentional centered-form warning.
- Final populated/empty/error dashboard and section-introduction fixtures: 0 FAIL at 1440, 768 and 390px. Remaining warnings are described above. The error fixture has no warnings.
- Opened final screenshot sheets for every inspected viewport and state. The real custom font loaded in both production and isolated previews.
- Fresh mobile browser check: all images decoded, 56px logo box, no horizontal overflow; accordion switched the open item; registration opened; protected Discover and Sessions links correctly reached login; no browser exceptions. No registration or sign-in form was submitted.
- Short desktop sidebar fixture: 480px viewport, 742px sidebar content, `scrollTop` reached 262px, computed `overflow-y: auto`, `scrollbar-width: none` and WebKit scrollbar `display: none`.
- The Next.js build retains an existing workspace-root warning about a package-lock.json outside this repository. It does not block the build.

| Measurement | Before | Final |
| --- | --- | --- |
| Main typeface | System sans | Locally hosted Plus Jakarta Sans |
| App title | 24px / 30px at weight 600 | 28px / 32px at weight 700 |
| Small supporting text | 12px / 14px | 14px / 15px |
| Form input text on desktop | 14px | 16px |
| Logo display box | 40px / 48px | 56px / 64px |
| Authenticated artwork | None | 112px / 144px in section intros; 96px / 112px on home |
| Public artwork | One previous scene | Three new scenes, reused consistently |
| Sidebar scrollbar | Browser default | Hidden; scrolling retained |

## Written visual critique

ROUND 1

Seen in one second: A calm but visually anonymous student workspace.

Idea (one sentence): The student pair and learning group become the two recognizable illustrations of MMXchange's separate learning modes.

Live thing: Existing request/scheduling actions in the app; native getting-started accordion on the public page.

Layout words by section: hero=illustrated split / learning modes=alternating rows / start=gold accordion / app=personal action and activity panels.

Scores: design 6.5 · usability 8 · creativity 6.5 · content 8 → overall 7.1

Caps applied: This is a familiar peer-learning concept rather than a unique category invention; no score above 7 for creativity.

Top three problems and fixes:

1. Before dashboard desktop: identical subdued panels and system type made the page feel plain. Add a distinctive local typeface, a pale sage main-action panel and white secondary panels.
2. First illustrated tablet dashboard: artwork squeezed the suggested activity heading. Give the heading full width and place artwork beside its supporting sentence.
3. First mobile section introduction: the action competed with description space. Stack actions beneath the introduction on phones.

ROUND 2

Seen in one second: A friendly student learning app with bolder text and recognizable characters.

Idea (one sentence): Two learning modes have different scenes while the curious student connects introductions and next actions.

Live thing: Native accordion, actual registration/discovery/session links and existing authenticated activity controls.

Layout words by section: hero=sage split / learning modes=alternating illustrated explanations / start=gold disclosure / app=bold titles and larger contextual art.

Scores: design 6.5 · usability 8.5 · creativity 7 · content 8 → overall 7.4

Caps applied: The marketing rubric caps design at 6.5 when drawings stand in for photographs; this intentionally follows the user's illustration reference. These are self-review scores, not independent usability results.

Top three remaining limitations:

1. Final populated/empty dashboard sheets: panels with different row counts end at different heights. Preserve honest natural content heights rather than fabricate activity or stretch empty panels.
2. Final public desktop sheet: the art's transparent silhouette makes its visual right edge differ slightly from the shared container edge. Header, chapter and footer containers have equal outer padding.
3. Final dashboard fixtures: interactions involving actual profiles and database records still require signed-in review. The fixture is presentation evidence only.
