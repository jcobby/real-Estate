import { describe, expect, it } from "vitest";
import { NO_LISTING_IMAGE, normalizeListing } from "./normalize";
import type { Listing } from "@/types";

describe("normalizeListing images", () => {
  const base = { id: "lst-9", images: [] } as unknown as Listing;

  it("serves genuine remote image URLs unchanged", () => {
    const urls = ["https://cdn.realestate.app/a.jpg", "https://cdn.realestate.app/b.jpg"];
    expect(normalizeListing({ ...base, images: urls }).images).toEqual(urls);
  });

  it("routes localhost/backend upload URLs through the same-origin proxy", () => {
    const raw = "http://localhost:3001/v1/uploads/files/x.jpg";
    expect(normalizeListing({ ...base, images: [raw] }).images).toEqual([`/api/img?src=${encodeURIComponent(raw)}`]);
  });

  it("drops blank entries but keeps the real ones", () => {
    const l = normalizeListing({ ...base, images: ["https://x.io/a.jpg", "", "   "] as string[] });
    expect(l.images).toEqual(["https://x.io/a.jpg"]);
  });

  it("uses a neutral placeholder only when the backend has no photos", () => {
    expect(normalizeListing(base).images).toEqual([NO_LISTING_IMAGE]);
    expect(normalizeListing({ ...base, images: ["", "  "] as string[] }).images).toEqual([NO_LISTING_IMAGE]);
  });
});
