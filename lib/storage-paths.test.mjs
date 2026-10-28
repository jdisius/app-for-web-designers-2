import assert from "node:assert/strict";
import { test } from "node:test";
import { isOwnImagePath, thumbPathOf } from "./storage-paths.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const FILE = "33333333-3333-4333-8333-333333333333";

test("accepts a path in the user's own folder", () => {
  assert.equal(isOwnImagePath(A, `${A}/${FILE}.webp`), true);
  assert.equal(isOwnImagePath(A, `${A}/${FILE}.jpg`), true);
});

test("rejects another user's folder and malformed paths", () => {
  assert.equal(isOwnImagePath(A, `${B}/${FILE}.webp`), false);
  assert.equal(isOwnImagePath(A, `${A}/../${B}/${FILE}.webp`), false);
  assert.equal(isOwnImagePath(A, `${A}/${FILE}_thumb.webp`), false);
  assert.equal(isOwnImagePath(A, `${A}/${FILE}.svg`), false);
  assert.equal(isOwnImagePath(A, `${A}/nested/${FILE}.webp`), false);
});

test("derives the thumbnail path next to the image", () => {
  assert.equal(thumbPathOf(`${A}/${FILE}.webp`), `${A}/${FILE}_thumb.webp`);
});
