import assert from "node:assert";
import { containsExternalLink } from "../lib/externalLink.js";

describe("containsExternalLink", () => {
  describe("http link", () => {
    it("detects an http URL", () => {
      assert.equal(containsExternalLink("see http://example.com"), true);
    });
  });

  describe("www link", () => {
    it("detects a www host", () => {
      assert.equal(containsExternalLink("visit www.example.com"), true);
    });
  });

  describe("plain text", () => {
    it("allows text that is not a link", () => {
      assert.equal(containsExternalLink("hello room"), false);
    });
  });
});
