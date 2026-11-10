# PLAN.md

Status: approved 2026-10-28; all 13 steps done; Docker not used, hosted Supabase project instead (pgTAP via SQL editor).

How to use this file:
- Work one step at a time. A step is done when the "Definition of done" in CLAUDE.md passes and the step's own check passes.
- Tick the box, add a one-line note (date, anything left open), and commit after each step.
- If a step turns out to need a change to the data model, policies, auth or scope, stop and ask first.

## Prerequisites (on the developer's machine)
- Node.js 24.x, Docker Desktop running (local Supabase needs it), Claude Code.
- A hosted Supabase project and a Vercel account are needed only from step 13. The developer adds keys to `.env.local` and Vercel; Claude never reads them.

## Steps

- [x] 1. Scaffold and guardrails (2026-10-28: lint, tsc, build pass; 375px check to do by hand on `/`; scaffold's AGENTS.md had nothing worth keeping; CLAUDE (7).md renamed to CLAUDE.md)
  - create-next-app: TypeScript, ESLint, Tailwind, App Router, Cache Components off. If it refuses the folder because CLAUDE.md and PLAN.md are there, scaffold into a temporary folder and move the files in.
  - Install `@supabase/supabase-js`, `@supabase/ssr`, `motion`, `zod`. Add `eslint.config.mjs`, `"lint": "eslint ."`, `"engines": { "node": "24.x" }`.
  - Root layout with `lang="cs"`, the `viewport` export (`viewportFit: 'cover'`), a next/font font with `latin-ext`, placeholder `@theme` tokens in `app/globals.css`.
  - `.env.example`, `.claude/settings.json` and the hook scripts. Move anything useful from the generated AGENTS.md into CLAUDE.md, then delete it.
  - Replace "Commands" in CLAUDE.md with the real scripts and add "Folder structure".
  - Check: an empty page at 375px with no horizontal scroll.

- [x] 2. Schema migration (2026-10-28: pushed to hosted project APP demo, types generated, 9 pgTAP tests passed in the SQL editor; `db reset` not run, no Docker)
  - Enums, the six tables, CHECKs (budget > 0, message body 1–1000), unique constraints, indexes on policy columns. `budget` is an integer (whole crowns).
  - Grants: column-level UPDATE on profiles (name, bio) and briefs (image_url, deadline, budget, description); swipes SELECT and INSERT only; no direct INSERT on selections; nothing to `anon`. RLS enabled on every table.
  - Sign-up trigger with role validation; role cannot change.
  - Check: pgTAP tests that a bad role fails sign-up, the role cannot be changed and bad values are rejected; `db reset` succeeds; DB types regenerated.

- [x] 3. Policies and selection RPC (2026-10-28: pushed, 27 pgTAP assertions passed in the SQL editor, types regenerated)
  - Helpers in the `private` schema (e.g. `is_brief_owner`, `has_liked_brief`), one policy per operation on every table.
  - `select_designer` RPC: security definer, row lock on the brief, checks from CLAUDE.md, execute for `authenticated` only.
  - Add `messages` to the `supabase_realtime` publication.
  - Check: pgTAP with two designers and two customers; each is denied the others' data (0 rows, 0 changes or 42501). The RPC rejects a non-author, a taken brief and a designer who did not like the brief.

- [x] 4. Storage (2026-10-28: pushed, 8 pgTAP assertions passed; direct DELETE on storage.objects is blocked by Supabase, so cross-user delete is tested through the Storage API in step 7)
  - `portfolio` and `briefs` buckets in a migration (5 MB, image/jpeg, image/png, image/webp) with folder-ownership policies.
  - Check: user B cannot upload into or delete from user A's folder.

- [x] 5. Supabase clients and auth (2026-10-28: sign-up lands each role on its main screen, checked by hand; cross-role redirect not hand-checked; hosted "Confirm email" had to be switched off in the dashboard)
  - `lib/supabase/server.ts`, `lib/supabase/client.ts`, `proxy.ts` session refresh.
  - Role selection, sign-up (role from the first screen), login, logout, route guards by auth state and role with `getClaims()` on the server.
  - Check: each role lands on its main screen after sign-up; a customer opening a designer page is redirected, and the reverse.

- [x] 6. App shell and profile (2026-10-28: checked by hand on phone, all pages OK; chats/designers are heading-only placeholders)
  - LOGO box, account icon, role-based bottom nav with safe-area padding.
  - Profile page: view and edit name and bio, log out.
  - Check: 375px, no horizontal scroll on every page so far.

- [x] 7. Image pipeline (2026-10-28: upload verified on PC (localhost); phone over http://LAN-IP threw 'Illegal invocation' before a fix that avoids crypto.randomUUID/getClaims in the browser, phone retest still open; cross-user path rejection covered by unit tests only, not tried against the live app; temporary console.error in components/portfolio-uploader.tsx to remove once phone works)
  - Browser downscale to max 1600px (WebP, JPEG fallback) plus a 400px thumbnail; upload both straight to Storage.
  - Server Action checks both paths belong to the user, inserts the row, and deletes the files if the insert fails. Batch signed URLs.
  - Check: a large phone photo arrives as a small image plus thumbnail; a path in another user's folder is rejected.

- [x] 8. Designer onboarding and portfolio (2026-10-29: checked by the developer, works)
  - 3–6 uploads and the "Potvrzuji, že jde o moje vlastní dílo" checkbox; redirect back while fewer than 3 images.
  - Manage images on the profile page within 3–6; grid with a larger view.
  - Check: a designer with 2 images cannot reach Swipe; the server refuses going below 3 or above 6.

- [x] 9. New brief (customer) (2026-10-29: checked by the developer, works; photo optional via migration 20261029100000; pgTAP 29/29 run via db query --linked)
  - Form with optional photo, deadline, budget, description using the shared Zod schema; the customer's briefs with status below it. Migration makes `briefs.image_url` nullable (decided 2026-10-29).
  - Check: a past date (Prague time) and an empty budget get Czech errors; 1500.6 is saved as 1501; amounts show "1 500 Kč"; a brief with and without a photo both save and list.

- [x] 10. Swipe (designer) (2026-10-30: checked by the developer on phone, works)
  - Card layout without a photo for briefs that have none.
  - Motion card deck with drag and buttons; only open briefs this designer has not swiped; writes swipes.
  - Check: a swiped brief never returns after reload; drag and buttons both work at 375px.

- [x] 11. Designers tab and "Vybrat" (customer) (2026-10-30: checked by the developer, works; Vybrat sits on the full profile; "Zakázka obsazena" display comes with Moje zájmy in step 12)
  - Per open brief, the designers who liked it (name, short bio, 3 thumbnails); full profile with portfolio grid; "Vybrat" calls the RPC, errors shown in Czech.
  - Check: after "Vybrat" the brief is taken and other designers who liked it see "Zakázka obsazena" in "Moje zájmy".

- [x] 12. Chats (2026-10-30: checked by the developer with three accounts, works)
  - Chat lists for both roles, the "Moje zájmy" section, chat page with live messages and the input fixed at the bottom.
  - Check: two sessions exchange messages live; a third user can neither read nor receive them.

- [x] 13. Final pass and deploy (2026-10-31: all pages checked by the developer, works; Vercel already connected to Supabase by the developer; code pushed to GitHub; labels left as they are)
  - 375px check of every page; list all Czech strings added along the way for review.
  - Vercel environment variables (set by the developer); `npx supabase db push` and deploy only after approval.

- [x] 14. Design refresh (2026-11-10: on branch `design-refresh`; lint, tsc, build and unit tests pass; only `/`, `/login`, `/signup` looked at in a browser, logged-in pages and the 375px check still to do by hand)
  - Dark theme tokens in `app/globals.css` (violet primary, amber accent, new `surface` token), Outfit font, styling only: no data, policy or logic changes.
  - Shared classes in `components/field.tsx`; new `components/avatar.tsx` and `components/empty-state.tsx`; bottom nav with icons.
  - New or changed Czech strings: "Designéři a zakázky na jedno přejetí", "Zadejte zakázku, nebo si vybírejte ty, které vás baví.", nav "Zakázky" (was "Swipe") and "Nová zakázka" (was "+ Nová zakázka"), profile role labels "Designér" / "Zákazník".
