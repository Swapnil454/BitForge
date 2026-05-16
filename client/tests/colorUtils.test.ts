import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAutoTextColor, isValidHexColor } from "../lib/colorUtils";

describe("colorUtils", () => {
  describe("isValidHexColor", () => {
    it("should return true for valid 6-digit hex colors", () => {
      assert.equal(isValidHexColor("#FFFFFF"), true);
      assert.equal(isValidHexColor("#000000"), true);
      assert.equal(isValidHexColor("#2563EB"), true);
      assert.equal(isValidHexColor("#f97316"), true);
    });

    it("should return true for valid 3-digit hex colors", () => {
      assert.equal(isValidHexColor("#FFF"), true);
      assert.equal(isValidHexColor("#000"), true);
      assert.equal(isValidHexColor("#f00"), true);
    });

    it("should return false for invalid hex colors", () => {
      assert.equal(isValidHexColor("FFFFFF"), false); // missing #
      assert.equal(isValidHexColor("#FFFFF"), false); // 5 digits
      assert.equal(isValidHexColor("#ZZZZZZ"), false); // invalid characters
      assert.equal(isValidHexColor("blue"), false);
    });
  });

  describe("getAutoTextColor", () => {
    it("should return 'dark' for bright backgrounds", () => {
      // White
      assert.equal(getAutoTextColor("#FFFFFF"), "dark");
      // Bright yellow
      assert.equal(getAutoTextColor("#FFFF00"), "dark");
      // Light gray
      assert.equal(getAutoTextColor("#F3F4F6"), "dark");
    });

    it("should return 'light' for dark backgrounds", () => {
      // Black
      assert.equal(getAutoTextColor("#000000"), "light");
      // Slate 900
      assert.equal(getAutoTextColor("#0F172A"), "light");
      // Deep blue (default)
      assert.equal(getAutoTextColor("#2563EB"), "light");
      // Dark purple
      assert.equal(getAutoTextColor("#7C3AED"), "light");
    });
  });
});
