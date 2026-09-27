import assert from "node:assert";
import { isUnderMinAge } from "../lib/ageGate.js";

describe("isUnderMinAge", () => {
  describe("under the minimum", () => {
    it("returns true when the age is below the group minimum", () => {
      assert.equal(isUnderMinAge(17, 18), true);
    });
  });

  describe("equal to the minimum", () => {
    it("returns false when the age matches the group minimum", () => {
      assert.equal(isUnderMinAge(18, 18), false);
    });
  });

  describe("missing age", () => {
    it("does not treat a missing age as under the minimum", () => {
      assert.equal(isUnderMinAge(undefined, 18), false);
    });
  });
});
