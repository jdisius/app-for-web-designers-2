import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeMessages } from "./chat.ts";
import { messageSchema } from "./schemas/message.ts";

const ID = "33333333-3333-4333-8333-333333333333";
const m = (id, created_at) => ({ id, created_at });

test("mergeMessages: dedupes by id and sorts by time", () => {
  const merged = mergeMessages([m("b", "2026-01-01T10:00:02Z")], [m("a", "2026-01-01T10:00:01Z"), m("b", "2026-01-01T10:00:02Z")]);
  assert.deepEqual(merged.map((x) => x.id), ["a", "b"]);
});

test("messageSchema: 1-1000 characters after trimming", () => {
  assert.equal(messageSchema.safeParse({ selectionId: ID, body: "ahoj" }).success, true);
  assert.equal(messageSchema.safeParse({ selectionId: ID, body: "   " }).success, false);
  assert.equal(messageSchema.safeParse({ selectionId: ID, body: "a".repeat(1000) }).success, true);
  assert.equal(messageSchema.safeParse({ selectionId: ID, body: "a".repeat(1001) }).success, false);
  assert.equal(messageSchema.safeParse({ selectionId: "x", body: "ahoj" }).success, false);
});
