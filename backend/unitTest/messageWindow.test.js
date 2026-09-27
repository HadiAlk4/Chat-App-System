import assert from "node:assert";
import { latestMessagesOldestFirst } from "../lib/messageWindow.js";

function message(id, minute) {
  return { id, timestamp: new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString() };
}

describe("latestMessagesOldestFirst", () => {
  describe("more than five", () => {
    it("keeps only the latest five messages", () => {
      const messages = [0, 1, 2, 3, 4, 5, 6].map((minute) => message(minute, minute));
      const window = latestMessagesOldestFirst(messages);
      assert.deepStrictEqual(window.map((item) => item.id), [2, 3, 4, 5, 6]);
    });
  });

  describe("exactly five", () => {
    it("returns all five messages", () => {
      const messages = [0, 1, 2, 3, 4].map((minute) => message(minute, minute));
      const window = latestMessagesOldestFirst(messages);
      assert.equal(window.length, 5);
    });
  });

  describe("fewer than five", () => {
    it("returns every message when the room has fewer than five", () => {
      const messages = [message(1, 1), message(2, 2)];
      assert.equal(latestMessagesOldestFirst(messages).length, 2);
    });
  });

  describe("oldest-first order", () => {
    it("returns the window with the oldest message first", () => {
      const messages = [message("c", 3), message("a", 1), message("b", 2)];
      const window = latestMessagesOldestFirst(messages);
      assert.deepStrictEqual(window.map((item) => item.id), ["a", "b", "c"]);
    });
  });
});
