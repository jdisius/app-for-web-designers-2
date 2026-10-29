# CLAUDE.md

<!-- Maintainer notes (stripped before Claude reads this file): sub-bullets starting "Current (2026-10-28)" annotate original lines that were outdated or incomplete on that date; re-verify them and the Stack version list when the project is created. Must-hold rules are also enforced in .claude/settings.json. Keep this file under ~200 lines: add a line when Claude repeats a mistake, delete lines it no longer needs. -->

## Project
- Demo web app for the Czech market, mobile-first: swipe-based marketplace connecting designers and customers.
- Customers post briefs (optional reference photo, deadline, budget, short description).
- Designers swipe briefs: right = interested, left = skip.
- Customers never swipe: they see designers who liked their brief, review profile + portfolio, select one.
- Selection creates a chat between customer and designer; other designers who liked the brief see "Zakázka obsazena".

## Working rules
- First propose a short plan and wait for approval, then implement in small steps.
  - The plan names the files to touch, any migration or policy change, and how each step will be verified.
  - Keep the approved plan and its progress in PLAN.md and update it after each step, so a new session can continue.
  - Ask before any choice that changes the data model, RLS/Storage policies, auth or scope. For details this file leaves open (layout, spacing, wording), choose a sensible default and list it in the summary.
- Stay within the demo scope; do not add extra features.
  - If something seems needed but is not in this file, say so in one sentence and continue without building it (see "Out of scope").
- After each larger change, run lint and build, then summarize what changed.
  - Each completed plan step counts as a larger change; the full checks are under "Definition of done".
  - Current (2026-10-28): Next.js 16 removed `next lint`, and `next build` no longer lints, so lint runs as its own command (see Commands).
- Once the project exists, add sections "Commands" (dev, build, lint) and "Folder structure" to this file.
  - "Commands" below lists the expected npm commands; replace them with the real scripts after scaffolding. Keep "Folder structure" to locations Claude cannot guess (generated types, Supabase clients, tests), not a full tree.

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint` (the script runs `eslint .`)
- Typecheck: `npx tsc --noEmit` (run after `npm run build` or `next typegen`, which generate the `LayoutProps` route types)
- Build: `npm run build`
- Unit tests (Node's built-in runner, `lib/*.test.mjs`): `npm test`
- Start local Supabase (Docker must be running): `npx supabase start`; local URL and keys: `npx supabase status`
- New migration: `npx supabase migration new <name>` (the file lands in supabase/migrations)
- Re-apply all migrations and the seed locally: `npx supabase db reset`
- DB and RLS tests (pgTAP files in supabase/tests): `npx supabase test db`
- DB types: `npx supabase gen types typescript --local > lib/database.types.ts` (generated; never edit by hand)
- Push migrations to the hosted project: `npx supabase db push`, only after the user approves.

## Folder structure
- `app/` routes (App Router); `app/globals.css` holds the Tailwind `@theme` tokens.
- `lib/supabase/` server and browser clients; `lib/database.types.ts` generated, never edited by hand.
- `lib/images.ts` browser resize and upload; `lib/storage-paths.ts` path helpers shared with Server Actions.
- `proxy.ts` (repo root) session refresh; `supabase/migrations`, `supabase/tests` (pgTAP).
- `.claude/settings.json` and `.claude/hooks/` enforce the must-hold rules (no .env reads, no hardcoded colors, no secret keys in app code).

## Definition of done (each step)
- `npm run lint`, `npx tsc --noEmit` and `npm run build` pass. Never edit or delete a test just to make it pass; if a test looks wrong, say so.
- After a migration: `npx supabase db reset` succeeds, `npx supabase test db` passes, and DB types are regenerated.
- After a UI change: if a browser tool is available, open the page at 375px width and confirm `document.documentElement.scrollWidth <= 375` and that Czech diacritics render; otherwise list the pages to check by hand.
- The summary names the commands run and their results, what changed, and any new Czech strings or assumptions.

## Stack
- Next.js (App Router) + TypeScript, Node.js, deployed on Vercel.
  - Current (2026-10-28): Next.js 16 on Node.js 24.x (Vercel's default; Node 20 is deprecated there). Set `"engines": { "node": "24.x" }` in package.json.
  - Cache Components is off (decided 2026-10-28). create-next-app turns it on by default, so scaffold without it and keep `cacheComponents` and `partialPrefetching` out of next.config.ts.
- Supabase: Postgres, Auth (email + password), Storage, Realtime. Use @supabase/ssr for cookie-based sessions.
  - Current (2026-10-28): give the clients only the `getAll`/`setAll` cookie methods; never use `get`/`set`/`remove` or `@supabase/auth-helpers-nextjs`. Session refresh runs in `proxy.ts` (Next.js 16's name for `middleware.ts`). Create one server client per request.
  - On the server, get the user with `supabase.auth.getClaims()` (user id is `data.claims.sub`). Never trust `getSession()` in server code, because the session cookie can be forged.
- Tailwind CSS.
  - Current (2026-10-28): Tailwind v4 is configured in CSS. Tokens live in `@theme` in `app/globals.css`; do not create `tailwind.config.*`.
- Swipe cards: Motion (motion package, formerly framer-motion). Do not build swipe gestures from scratch.
  - Current (2026-10-28): import from `motion/react`, not `framer-motion`. The swipe deck is a Client Component (`'use client'`). Motion 14 is a new major (October 2026); if an older example fails, check the installed type definitions.
- Zod schemas for all inputs, shared by forms and server code.
  - Current (2026-10-28): Zod 4 API: `z.email()` instead of `z.string().email()`, `{ error: "..." }` instead of `{ message }`. Keep schemas in a module with no server-only imports so forms and Server Actions can share it.
- Versions on npm on 2026-10-28 (re-check when scaffolding): next 16.4.3, react 19.3.1, tailwindcss 4.3.3, motion 14.7.1, zod 4.6.7, eslint 10.13.0. Next.js 16 needs TypeScript 5.1+; TypeScript 7 with `next build` is unverified.

## Language
- All UI texts in Czech, <html lang="cs">. Tab names below are descriptive; real labels are Czech.
- Code, comments and variable names in English.
- Format dates and CZK amounts with Intl using the cs-CZ locale.
  - Pass `timeZone: 'Europe/Prague'` to date formatters so server and browser render the same day. cs-CZ output uses non-breaking spaces (U+00A0), so tests compare against `\u00a0`, not a plain space.
  - CZK in whole crowns, no haléře: `{ style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }` gives "1 500 Kč".

## UI terms (labels this file already fixes)
- Swipe right = like (`swipes.liked = true`); swipe left = skip (`liked = false`). A selection is the customer choosing one designer for a brief.

| Concept in code | UI text |
|---|---|
| Role choice: designer / customer | "Jsem designér" / "Jsem zákazník" |
| Link from role selection to login | "Už mám účet" |
| Portfolio ownership checkbox | "Potvrzuji, že jde o moje vlastní dílo" |
| Liked briefs section in the designer's Chats tab | "Moje zájmy" |
| Select a designer for a brief | "Vybrat" |
| Brief given to someone else (status `taken`) | "Zakázka obsazena" |

## Design
- Mobile-first, must work at 375px width, no horizontal scrolling.
- Rounded, bold buttons inspired by Fiverr's shape and weight only. Never copy another brand's colors, fonts, logo or assets.
- Brand colors and font are TBD: define them as Tailwind theme tokens (primary, secondary, accent, ...) with placeholder values.
  - In Tailwind v4 these are `@theme` variables (`--color-primary`, ...). Map the next/font CSS variable with `@theme inline`, e.g. `--font-sans: var(--font-brand);`.
- Never hardcode hex colors or font names in components; use the tokens.
  - This includes arbitrary values such as `bg-[#ff6600]` or `font-['Inter']`. The tokens exist so the brand can be swapped in one place once it is decided.
- The final font must support Czech diacritics.
  - Load it via next/font with `subsets: ['latin', 'latin-ext']` (ě š č ř ž ů are in latin-ext). Test string: "Příliš žluťoučký kůň úpěl ďábelské ódy".

## Global layout (every page after login)
- Top-left: logo placeholder, an empty box with the text "LOGO".
- Top-right: account icon, opens the user's profile page (view/edit profile, log out).
- Bottom navigation bar; tabs depend on role.
  - Fixed bottom elements (this bar, the chat input) need bottom padding of `env(safe-area-inset-bottom)`, which is non-zero only with `viewportFit: 'cover'` in the root layout's `viewport` export.

## App flow
- Role selection (first screen, before login): big buttons "Jsem designér" / "Jsem zákazník", link "Už mám účet" to login.
- Sign up: name, email, password, repeat password. Role comes from step 1.
- Email confirmation is OFF in Supabase Auth: the user is logged in right after sign-up.
  - Set this in the hosted project's Auth settings and in local `supabase/config.toml`, so both environments behave the same.
  - Demo only: turn email confirmation on before real users.
- Designers must upload 3–6 portfolio images and tick "Potvrzuji, že jde o moje vlastní dílo" before continuing.
- A designer with fewer than 3 images is always redirected back to this step.
- Customers go straight to their main screen.
- Role is fixed after sign-up. Route guards redirect by auth state and role.
  - Every protected page and Server Action also checks the user on the server with `getClaims()`; a redirect alone does not protect data.

## Designer side (nav: Swipe | Chats)
- Swipe: cards with open briefs (photo if there is one, deadline, budget, description). Swipe right = like, left = skip, plus buttons for both.
- A brief already liked or skipped is never shown again.
- Chats: list of chats with customers who selected this designer; tap opens the chat.
- Chats tab also has a section "Moje zájmy": all liked briefs with their status.
- Briefs given to someone else show "Zakázka obsazena".
- Bio is edited on the profile page (not part of sign-up).

## Customer side (nav: + New brief | Designers | Chats)
- New brief: form with optional reference photo upload, deadline (date, not in the past), budget (CZK), short description.
  - Check "not in the past" in the Server Action against today's date in Europe/Prague. `z.coerce.number()` turns an empty budget into 0, so check for a non-empty value before coercing.
- Below the form: the customer's existing briefs with status.
- Designers: for each open brief, the designers who liked it.
- Card: name, short bio, first 3 portfolio thumbnails. Tap opens full profile with portfolio grid.
  - Thumbnails come from the browser-made thumbnail files (see Portfolio), not Supabase image transformations, which need the Pro plan. The project stays on the Free plan.
- "Vybrat" selects that designer (one per brief): brief becomes taken, selection and chat are created.
- Chats: list of chats with selected designers; tap opens the chat.

## Portfolio
- 3–6 images per designer, Storage bucket portfolio. Max 5 MB, jpg/png/webp only.
  - MIME types for the bucket and Zod: image/jpeg, image/png, image/webp (`image/jpg` is not a valid MIME type).
  - Before every upload (portfolio and brief photo), downscale in the browser to max 1600px on the longest side and compress to WebP (JPEG if the browser cannot encode WebP; check the blob's type). From the same image make a thumbnail of max 400px.
  - Store the thumbnail as `{user_id}/{uuid}_thumb.{ext}` next to `{user_id}/{uuid}.{ext}`, so no extra column is needed; uploads, path checks and deletes always cover both. Thumbnails go in cards, grids and lists; the full image in the swipe card and the larger view.
- Designers manage images on their profile page, always staying within 3–6.
- Profile shows an image grid; tap opens a larger view. No external links.

## Chat
- Exists only after a selection; one chat per selection (a chat is identified by selection_id).
- Text only, 1–1000 characters. Live messages via Supabase Realtime on messages.
  - Add `public.messages` to the `supabase_realtime` publication in a migration. Subscribe to INSERT with filter `selection_id=eq.<id>`, remove the channel on unmount, dedupe by message id, and re-fetch after (re)subscribing because missed events are not replayed. The messages SELECT policy decides who receives events.
- Chat page: message list, input fixed at the bottom.
- No attachments, typing indicators or read receipts.

## Data model
- profiles (id = auth user id, role: designer | customer, name, bio, created_at). Created by a trigger on sign-up.
- The trigger accepts only designer or customer from sign-up metadata; any other value raises an error and sign-up fails.
  - Trigger function: `security definer set search_path = ''`, schema-qualified names, explicit `raise exception` for a bad role. The source of truth for role is `profiles.role`; never read it from `user_metadata`, which users can edit.
- portfolio_items (id, designer_id, image_url, title optional, created_at)
- briefs (id, customer_id, image_url (nullable: the photo is optional), deadline, budget, description, status: open | taken, created_at)
  - `budget` is an integer in whole crowns. The Server Action rounds a decimal entry to the nearest crown before saving, then checks it is still > 0 (decided 2026-10-28).
- swipes (designer_id, brief_id, liked boolean, created_at), unique (designer_id, brief_id)
- selections (id, brief_id unique, designer_id, created_at)
- messages (id, selection_id, sender_id, body, created_at)
- image_url stores the Storage object path (null for a brief without a photo); render images via signed URLs.
  - Sign many paths in one call with `createSignedUrls` (expiry is in seconds); never store signed URLs.
- Back up app rules in the DB: enums for role/status, CHECK constraints (budget > 0, message body 1–1000 chars).
- Selecting a designer is one Postgres function (RPC): insert selection + set brief to taken in a single transaction.
- It must verify: caller is the brief's author, brief is still open, designer liked this brief. Otherwise raise an error.
  - Make it `security definer set search_path = ''` and lock the brief row (`select ... for update`) so two selections cannot race. A definer function bypasses RLS, so all checks live in its body; give `authenticated` no direct INSERT on selections, so the RPC is the only way to create a selection (decided 2026-10-28).
  - In the same migration: `revoke execute ... from public, anon` and `grant execute ... to authenticated`. Raise stable error messages that the UI maps to Czech text.
- All schema changes are SQL migrations in supabase/migrations. Generate TypeScript types from the DB.

## Security (mandatory)
- RLS enabled on every table, Storage policies on every bucket. Default deny.
  - Current (2026-10-28): new tables in `public` are no longer exposed to the Data API automatically. In each table's migration, grant `authenticated` only the operations the rules below allow (nothing to `anon`), then enable RLS, then add policies. A missing grant fails with `42501 permission denied`.
  - Policy style: one policy per operation, `to authenticated`, `(select auth.uid())`, `with check` on INSERT and UPDATE (UPDATE also needs a SELECT policy), and an index on every column a policy filters on.
  - Avoid RLS recursion between briefs and swipes: use small security definer helper functions (e.g. is_brief_owner, has_liked_brief) inside policies instead of querying the other table directly. Put them in a non-exposed `private` schema with `set search_path = ''`; grant `authenticated` usage on the schema and execute on the helpers, nothing to `anon`.
- Profiles: readable by logged-in users; users update only their own row; role cannot be changed.
  - Reads by all logged-in users are intended for the demo (decided 2026-10-28).
  - Enforce "role cannot be changed" in the DB: grant UPDATE only on (name, bio), or reject role changes in a BEFORE UPDATE trigger.
- Briefs: customers see and edit only their own. Designers see only open briefs, plus briefs they liked.
  - Customers must not change `status`: grant UPDATE only on (image_url, deadline, budget, description). Only the selection RPC sets `status`.
- Swipes: only logged-in designers, only for themselves, only on open briefs. Customers can read only swipes with liked = true on their own briefs.
  - Swipes are final: grant only SELECT and INSERT on swipes (no UPDATE or DELETE), so a like or skip cannot be withdrawn.
- Selections: only the brief's author, only for a designer who liked that brief.
- Messages: only the selection's customer and designer can read and insert. sender_id = auth.uid(). No updates or deletes.
- Storage paths: {user_id}/{uuid}.{ext}; policies require the first folder to equal auth.uid().
  - Compare as text: `(storage.foldername(name))[1] = (select auth.uid()::text)`. Upload with `upsert: false`; overwriting needs extra SELECT and UPDATE policies.
- portfolio: any logged-in user reads; only the owner uploads or deletes.
- briefs: any logged-in user reads; only the author uploads or deletes. Same limits as portfolio.
  - Kept broad on purpose for the demo. Before real users, tighten reads to match DB brief visibility.
- Size and type limits are set in bucket config (file_size_limit, allowed_mime_types), so Supabase enforces them server-side.
  - Create the buckets in a migration so local and hosted projects match.
- Upload files from the browser directly to Storage (Server Actions default to 1 MB, Vercel functions ~4.5 MB).
  - The 1 MB limit is `experimental.serverActions.bodySizeLimit`; leave it as is. Vercel's limit is 4.5 MB per request or response body (HTTP 413 above it).
- The server action then checks the path belongs to the user and inserts the DB row.
- Validate every input on the server (Server Actions / Route Handlers with Zod), not only in forms.
  - Zod checks shape only. Each Server Action is a public POST endpoint, so it also gets the user from `getClaims()` and checks ownership.
- Only the anon key in the browser. Never put the service_role key in frontend code or the repo.
  - Current (2026-10-28): Supabase renamed the keys. The anon key is now the publishable key (`sb_publishable_...`, env `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`); the service_role key is now the secret key (`sb_secret_...`). Legacy anon/service_role keys are deprecated by the end of 2026.
  - The secret key never goes in a `NEXT_PUBLIC_*` variable. It bypasses RLS, so never use it to get around an RLS or permission error; fix the grant or policy instead. If a task seems to need it, ask first.
- Secrets only in .env.local (gitignored) and Vercel environment settings.
  - Do not read or print `.env` files (.claude/settings.json also blocks reading them); list variable names in `.env.example`.
- When adding a policy, verify that a different logged-in user is denied access.
  - Do it in a pgTAP test run by `npx supabase test db`, signed in as two different users; the SQL editor bypasses RLS and proves nothing. A denied SELECT returns 0 rows and a denied UPDATE/DELETE changes 0 rows without an error, while a failed `with check` raises 42501. Assert those outcomes.

## Out of scope (do not build until asked)
- Payments, Stripe, payouts, escrow.
- Email/push notifications, filters and sorting, multiple categories, designer verification.
- Chat attachments, blocking/reporting, admin panel.

## Open decisions
- Brand colors, font and logo: keep the placeholder tokens and the "LOGO" box until decided (see Design).
- Czech labels not given in this file (e.g. tab names): write natural Czech and list the new strings in the step summary for review.

## Gotchas
- Next.js 16: `cookies()`, `headers()`, `params` and `searchParams` are async and must be awaited.
- Views bypass RLS unless created `with (security_invoker = true)`.
- Postgres `date` values (deadline) arrive as "YYYY-MM-DD". Format them without converting through a local-time `Date`, or they can shift by a day.
- Many tutorials still show `middleware.ts`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `getUser()` in middleware; follow this file. For Next.js APIs, prefer the version-matched docs in `node_modules/next/dist/docs/` over memory.
- create-next-app also writes an AGENTS.md. Claude Code ignores AGENTS.md while this CLAUDE.md exists, so move anything useful from it into this file.
