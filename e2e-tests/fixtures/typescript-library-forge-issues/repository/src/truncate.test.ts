import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { truncate } from "./truncate.ts";
import { visibleWidth } from "./visible-width.ts";

const RED = "\u001B[31m";
const RESET = "\u001B[0m";

describe("truncate", () => {
  it("leaves a string that already fits", () => {
    assert.equal(truncate("hello", 5), "hello");
  });

  it("cuts to the width, ellipsis included", () => {
    assert.equal(truncate("hello world", 8), "hello w…");
    assert.equal(visibleWidth(truncate("hello world", 8)), 8);
  });

  it("keeps the escapes on both sides of the cut", () => {
    const cut = truncate(`${RED}hello world${RESET}`, 8);
    assert.ok(cut.startsWith(RED));
    assert.ok(cut.endsWith(`…${RESET}`) || cut.endsWith(`${RESET}…`));
    assert.equal(visibleWidth(cut), 8);
  });

  it("drops the ellipsis when there is no room for it", () => {
    assert.equal(truncate("hello", 0), "");
  });

  it("takes the ellipsis a caller passes", () => {
    assert.equal(truncate("hello world", 7, "..."), "hell...");
  });

  it("refuses a width that is not a non-negative integer", () => {
    assert.throws(() => truncate("hello", -1), RangeError);
    assert.throws(() => truncate("hello", 2.5), RangeError);
  });
});
