import { describe, expect, it } from "vitest";
import {
  formatAcres,
  formatGHS,
  formatSqft,
  initials,
  sqmToAcres,
  sqmToSqft,
  truncate,
} from "./format";

describe("formatGHS", () => {
  it("formats cedis with the ₵ sign", () => {
    expect(formatGHS(85000)).toBe("₵85,000");
  });
  it("formats compact amounts", () => {
    expect(formatGHS(1_400_000, { compact: true })).toBe("₵1.4M");
  });
});

describe("area conversions", () => {
  it("converts m² to ft²", () => {
    expect(sqmToSqft(100)).toBeCloseTo(1076.39, 1);
  });
  it("converts m² to acres", () => {
    expect(sqmToAcres(4046.86)).toBeCloseTo(1, 5);
  });
  it("renders formatted strings", () => {
    expect(formatSqft(650)).toBe("6,997 ft²");
    expect(formatAcres(4046.86)).toBe("1 acres");
  });
});

describe("string helpers", () => {
  it("builds initials from names", () => {
    expect(initials("Kwame Mensah")).toBe("KM");
    expect(initials("Ama")).toBe("A");
  });
  it("truncates long text with an ellipsis", () => {
    expect(truncate("a".repeat(120), 20)).toHaveLength(20);
    expect(truncate("short", 20)).toBe("short");
  });
});
