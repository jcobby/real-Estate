import { describe, expect, it } from "vitest";
import { collectionCenter, generateParcelGrid, ringAreaSqm } from "./geo";

describe("generateParcelGrid", () => {
  const grid = generateParcelGrid({
    estateId: "est-test",
    center: { lat: 5.8, lng: -0.1 },
    rows: 3,
    cols: 4,
    rotationDeg: 10,
    prefix: "TS",
    price: 60000,
    owner: "Test Estates Ltd",
  });

  it("creates rows × cols available plots with sequential numbers", () => {
    expect(grid.features).toHaveLength(12);
    expect(grid.features[0].properties.plotNumber).toBe("TS-001");
    expect(grid.features[11].properties.id).toBe("est-test-012");
    expect(grid.features.every((f) => f.properties.status === "available")).toBe(true);
    expect(grid.features.every((f) => f.properties.price === 60000)).toBe(true);
  });

  it("produces plots close to the standard 100ft × 70ft (~650 m²)", () => {
    for (const f of grid.features) {
      expect(f.properties.areaSqm).toBeGreaterThan(580);
      expect(f.properties.areaSqm).toBeLessThan(730);
      // geometry area should agree with the recorded property
      expect(ringAreaSqm(f.geometry.coordinates[0])).toBeCloseTo(f.properties.areaSqm, 0);
    }
  });

  it("centres the grid on the given point", () => {
    const c = collectionCenter(grid);
    expect(c.lat).toBeCloseTo(5.8, 3);
    expect(c.lng).toBeCloseTo(-0.1, 3);
  });
});

describe("ringAreaSqm", () => {
  it("measures a ~100m square as ~10,000 m²", () => {
    const lat = 5.8;
    const dLat = 100 / 111320;
    const dLng = 100 / (111320 * Math.cos((lat * Math.PI) / 180));
    const ring = [
      [0, lat],
      [dLng, lat],
      [dLng, lat + dLat],
      [0, lat + dLat],
      [0, lat],
    ];
    expect(ringAreaSqm(ring)).toBeCloseTo(10_000, -2);
  });
});
