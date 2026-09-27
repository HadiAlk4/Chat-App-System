import assert from "node:assert";
import { isValidPassword } from "../lib/passwordPolicy.js";

describe("isValidPassword", () => {
  describe("valid password", () => {
    it("accepts 8 alphanumeric characters with an uppercase letter", () => {
      assert.equal(isValidPassword("Password1"), true);
    });
  });

  describe("too short", () => {
    it("rejects a password shorter than 8 characters", () => {
      assert.equal(isValidPassword("Pass1"), false);
    });
  });

  describe("missing uppercase", () => {
    it("rejects a long password with no uppercase letter", () => {
      assert.equal(isValidPassword("password1"), false);
    });
  });

  describe("symbol rejected", () => {
    it("rejects a password that contains a symbol", () => {
      assert.equal(isValidPassword("Password1!"), false);
    });
  });
});
