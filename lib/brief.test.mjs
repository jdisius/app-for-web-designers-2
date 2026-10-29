import assert from "node:assert/strict";
import { test } from "node:test";
import { briefSchema, todayPrague } from "./schemas/brief.ts";
import { formatCzk, formatDate } from "./format.ts";

const ok = { imagePath: null, deadline: todayPrague(), budget: "1500", description: "Logo" };

test("budget: rounds to the nearest crown, rejects empty and below 1", () => {
  assert.equal(briefSchema.parse({ ...ok, budget: "1500.6" }).budget, 1501);
  assert.equal(briefSchema.parse({ ...ok, budget: "1500,4" }).budget, 1500);
  assert.equal(briefSchema.safeParse({ ...ok, budget: "" }).error.issues[0].message, "Zadejte rozpočet.");
  assert.equal(briefSchema.safeParse({ ...ok, budget: "0.4" }).success, false);
  assert.equal(briefSchema.safeParse({ ...ok, budget: "abc" }).success, false);
});

test("deadline: today is fine, the past is not", () => {
  assert.equal(briefSchema.safeParse(ok).success, true);
  const r = briefSchema.safeParse({ ...ok, deadline: "2020-01-01" });
  assert.equal(r.error.issues[0].message, "Termín nesmí být v minulosti.");
  assert.equal(briefSchema.safeParse({ ...ok, deadline: "2099-02-31" }).success, false);
});

test("imagePath: null or a well-formed path, nothing else", () => {
  const id = "33333333-3333-4333-8333-333333333333";
  assert.equal(briefSchema.safeParse({ ...ok, imagePath: `${id}/${id}.webp` }).success, true);
  assert.equal(briefSchema.safeParse({ ...ok, imagePath: "../etc/passwd" }).success, false);
  assert.equal(briefSchema.safeParse({ ...ok, imagePath: `${id}/${id}.svg` }).success, false);
  assert.equal(briefSchema.safeParse({ ...ok, imagePath: "" }).success, false);
});

test("formatting uses cs-CZ", () => {
  assert.equal(formatCzk(1500), "1\u00a0500\u00a0Kč");
  assert.equal(formatDate("2026-12-01"), "1. 12. 2026");
});
