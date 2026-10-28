// Blocks shell commands that would read env files or print secrets.
import { readFileSync } from "node:fs";

const { tool_input: input } = JSON.parse(readFileSync(0, "utf8"));
if (/(cat|type|Get-Content|less|more|head|tail|grep|rg)\b[^|;&]*\.env(\.|\s|$)(?!example)/.test(input.command ?? "")) {
  console.error("Do not read .env files; list variable names in .env.example instead.");
  process.exit(2);
}
