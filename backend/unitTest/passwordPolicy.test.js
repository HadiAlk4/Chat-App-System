import assert from "node:assert";
import { isValidPassword } from "../lib/passwordPolicy.js";

describe("isValidPassword", () => {
  describe("valid password", () => {
    it("accepts 8 alphanumeric characters with an uppercase letter", () => {
      assert.equal(isValidPassword("Password1"), true);
    });
  });

  describe("missing uppercase", () => {
    it("rejects a long password with no uppercase letter", () => {
      assert.equal(isValidPassword("password1"), false);
    });
  });

});
