// Blocks edits that break CLAUDE.md must-hold rules: hardcoded colors/fonts in components,
// secret keys in frontend code, tailwind.config.*, and the legacy middleware.ts / auth-helpers.
import { readFileSync } from "node:fs";

const { tool_input: input } = JSON.parse(readFileSync(0, "utf8"));
const path = (input.file_path ?? "").replaceAll("\\", "/");
const text = input.content ?? input.new_string ?? "";
const fail = (msg) => {
  console.error(msg);
  process.exit(2);
};

if (/(^|\/)tailwind\.config\./.test(path)) fail("Tailwind v4 is configured in app/globals.css; do not create tailwind.config.*.");
if (/(^|\/)middleware\.ts$/.test(path)) fail("Use proxy.ts (Next.js 16), not middleware.ts.");
if (/\.(tsx?|jsx?)$/.test(path)) {
  if (/service_role|sb_secret_|SUPABASE_SECRET/.test(text) && !path.includes("/supabase/")) fail("Never reference the Supabase secret/service_role key in app code; ask the user first.");
  if (/auth-helpers-nextjs/.test(text)) fail("Use @supabase/ssr, not auth-helpers-nextjs.");
  if (/\.(tsx|jsx)$/.test(path) && /(\[#[0-9a-fA-F]{3,8}\]|font-\['|#[0-9a-fA-F]{6}\b)/.test(text)) fail("No hardcoded hex colors or font names in components; use the theme tokens from app/globals.css.");
}
