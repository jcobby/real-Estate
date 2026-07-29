import { describe, expect, it } from "vitest";
import { intersectConvex, ringAreaSqm } from "@/lib/geo";
import { checkLandConflict } from "./conflicts";
import { getParcelCollection } from "@/data/estates";

describe("intersectConvex", () => {
  it("returns the overlap of two overlapping unit squares", () => {
    const a = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ];
    const b = [
      [1, 1],
      [3, 1],
      [3, 3],
      [1, 3],
      [1, 1],
    ];
    const overlap = intersectConvex(a, b);
    // overlap is the unit square [1,1]-[2,2]
    const xs = overlap.map((p) => p[0]);
    const ys = overlap.map((p) => p[1]);
    expect(Math.min(...xs)).toBeCloseTo(1, 6);
    expect(Math.max(...xs)).toBeCloseTo(2, 6);
    expect(Math.min(...ys)).toBeCloseTo(1, 6);
    expect(Math.max(...ys)).toBeCloseTo(2, 6);
  });

  it("returns empty for disjoint polygons", () => {
    const a = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const b = [[5, 5], [6, 5], [6, 6], [5, 6], [5, 6]];
    expect(intersectConvex(a, b)).toHaveLength(0);
  });
});

describe("checkLandConflict", () => {
  it("flags overlap with real registered Oyibi plots", async () => {
    // a boundary drawn over the dense Oyibi estate centre
    const ring = [
      [-0.087, 5.8262],
      [-0.0862, 5.8262],
      [-0.0862, 5.8268],
      [-0.087, 5.8268],
      [-0.087, 5.8262],
    ];
    const res = await checkLandConflict(ring);
    expect(res.clear).toBe(false);
    expect(res.conflicts.length).toBeGreaterThan(0);
    expect(res.totalOverlapSqm).toBeGreaterThan(0);
    // every reported conflict references a real Oyibi parcel and has positive overlap
    const oyibiIds = new Set(getParcelCollection("oyibi-hillcrest")!.features.map((f) => f.properties.id));
    for (const c of res.conflicts) {
      expect(c.overlapSqm).toBeGreaterThan(0);
      if (c.estateId === "oyibi-hillcrest") expect(oyibiIds.has(c.parcelId)).toBe(true);
    }
  });

  it("reports no conflict for a boundary far out at sea", async () => {
    const ring = [
      [-2, 4],
      [-1.999, 4],
      [-1.999, 4.001],
      [-2, 4.001],
      [-2, 4],
    ];
    const res = await checkLandConflict(ring);
    expect(res.clear).toBe(true);
    expect(res.conflicts).toHaveLength(0);
    expect(res.searcherSqm).toBeGreaterThan(0);
  });

  it("computes a sane searcher area (area helper agrees)", async () => {
    const ring = [
      [-0.087, 5.8262],
      [-0.0862, 5.8262],
      [-0.0862, 5.8268],
      [-0.087, 5.8268],
      [-0.087, 5.8262],
    ];
    const res = await checkLandConflict(ring);
    expect(res.searcherSqm).toBeCloseTo(ringAreaSqm(ring), 0);
  });
});
