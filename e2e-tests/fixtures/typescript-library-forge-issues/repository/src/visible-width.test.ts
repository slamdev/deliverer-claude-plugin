import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeAt, stripAnsi, visibleWidth } from "./visible-width.ts";

const RED = "\u001B[31m";
const RESET = "\u001B[0m";

describe("visibleWidth", () => {
  it("counts a plain string by its characters", () => {
    assert.equal(visibleWidth("hello"), 5);
  });

  it("charges nothing for the colour codes", () => {
    assert.equal(visibleWidth(`${RED}hello${RESET}`), 5);
  });

  it("counts a surrogate pair as one column", () => {
    assert.equal(visibleWidth("a🙂b"), 3);
  });

  it("is zero for the empty string", () => {
    assert.equal(visibleWidth(""), 0);
  });
});

describe("stripAnsi", () => {
  it("removes every escape and keeps everything else", () => {
    assert.equal(stripAnsi(`${RED}red${RESET} and plain`), "red and plain");
  });

  it("leaves a string with no escapes alone", () => {
    assert.equal(stripAnsi("nothing to strip"), "nothing to strip");
  });
});

describe("escapeAt", () => {
  it("finds the escape that starts at the index", () => {
    assert.equal(escapeAt(`${RED}hello`, 0), RED);
  });

  it("is null where a visible character starts", () => {
    assert.equal(escapeAt(`${RED}hello`, RED.length), null);
  });
});
