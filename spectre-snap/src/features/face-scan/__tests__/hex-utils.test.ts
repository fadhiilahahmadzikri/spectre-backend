import { describe, it, expect } from "vitest";
import { hexToRgb, rgbToHex, rgbTriplet } from "../lib/hex-utils";

describe("hexToRgb", () => {
  it("parses a leading '#' hex color", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#5e5ce6")).toEqual({ r: 94, g: 92, b: 230 });
  });

  it("parses without leading '#'", () => {
    expect(hexToRgb("ff2a5f")).toEqual({ r: 255, g: 42, b: 95 });
  });
});

describe("rgbToHex", () => {
  it("produces a canonical 6-digit hex", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(94, 92, 230)).toBe("#5e5ce6");
  });

  it("round-trips with hexToRgb", () => {
    const hex = "#ff6b00";
    const { r, g, b } = hexToRgb(hex);
    expect(rgbToHex(r, g, b)).toBe(hex);
  });
});

describe("rgbTriplet", () => {
  it("returns a comma-joined rgb string", () => {
    expect(rgbTriplet("#5e5ce6")).toBe("94, 92, 230");
  });
});
