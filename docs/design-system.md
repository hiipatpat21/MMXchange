# MMXchange interface

Apply `design-guide.md` to future screens, including prompt 7. Keep the MMSU
green (`#0c4b05`), gold (`#ffb800`), existing logo assets, and honest student-project
disclaimer. The neutral surfaces are interface colors, not additional university colors.

- **Type:** use the system stack in `app/globals.css`. Apple devices use their
  native system font; Windows falls back to Segoe UI. No font download is needed.
- **Pages:** use `page-heading` for the page's single h1. The authenticated layout
  supplies responsive margins, a maximum width, and the keyboard skip target.
- **Cards:** use `surface-card`, then responsive padding and appropriate spacing.
  Use borders and very light shadows; avoid gradients, blur, or ornamental motion.
- **Controls:** reuse Button, Input, Textarea, Label, and the dropdown primitives.
  Primary controls have at least 44px height. Icon buttons also need 44px width
  and an accessible name. Native selects use the shared base styling.
- **Forms:** keep required fields visible. Put optional fields in native details
  sections. Collapsing a section does not remove its values from FormData.
- **States:** use LoadingState or the dashboard skeletons inside Suspense.
  Include a useful empty state and a visible error with role="alert".
- **Motion:** keep hover, press, menu, and loading feedback short. The global
  reduced-motion rule removes nonessential animation when requested by the device.
- **Navigation:** render links only to built pages. Add future Messages and Forum
  navigation when their routes are implemented.

## Visual QA

Check landing, login/register, dashboard, Discover, student profiles, profile/skills,
session browse/create/edit/detail/personal lists, exchanges, and notifications at
375px, 768px, and 1280px. Check keyboard focus, the skip link, mobile navigation,
dropdowns, form submission, and optional-field values after expanding/collapsing.

The browser automation host was unavailable during this pass. TypeScript, lint,
production build, compiled styles, and rendered markup can be checked locally;
live browser and authenticated workflow checks still need a working browser session.
