import { describe, expect, it } from "vitest";
import { collectionCenter, convexHull, generateParcelGrid, parseParcelFile, polygonsOverlap, ringAreaSqm } from "./geo";

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

describe("parseParcelFile — KMZ", () => {
  const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>K-1</name>
<Polygon><outerBoundaryIs><LinearRing><coordinates>
-0.1,5.8,0 -0.099,5.8,0 -0.099,5.801,0 -0.1,5.801,0 -0.1,5.8,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`;

  async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
    const cs = new CompressionStream("deflate-raw");
    const writer = cs.writable.getWriter();
    const done = new Response(cs.readable).arrayBuffer();
    void writer.write(bytes as BufferSource);
    void writer.close();
    return new Uint8Array(await done);
  }

  /** Build a one-entry ZIP (KMZ) whose payload is DEFLATE-compressed, like real exporters. */
  async function makeKmz(name: string, content: string): Promise<File> {
    const enc = new TextEncoder();
    const nameBytes = enc.encode(name);
    const raw = enc.encode(content);
    const deflated = await deflateRaw(raw);
    const nLen = nameBytes.length;
    const cLen = deflated.length;

    const local = new Uint8Array(30 + nLen + cLen);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(8, 8, true); // method: deflate
    lv.setUint32(18, cLen, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, nLen, true);
    local.set(nameBytes, 30);
    local.set(deflated, 30 + nLen);

    const central = new Uint8Array(46 + nLen);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 8, true); // method: deflate
    cv.setUint32(20, cLen, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, nLen, true);
    cv.setUint32(42, 0, true); // local header offset
    central.set(nameBytes, 46);

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, 1, true);
    ev.setUint16(10, 1, true);
    ev.setUint32(12, central.length, true);
    ev.setUint32(16, local.length, true);

    const zip = new Uint8Array(local.length + central.length + eocd.length);
    zip.set(local, 0);
    zip.set(central, local.length);
    zip.set(eocd, local.length + central.length);
    return new File([zip], name.replace(/.*\//, "").replace(/\.kml$/i, ".kmz"), { type: "application/vnd.google-earth.kmz" });
  }

  it("unzips and parses the KML inside a KMZ archive", async () => {
    const file = await makeKmz("doc.kml", KML);
    const fc = await parseParcelFile(file, { estateId: "check", fallbackPrice: 0, fallbackOwner: "You" });
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].properties.plotNumber).toBe("K-1");
    expect(fc.features[0].properties.areaSqm).toBeGreaterThan(0);
  });

  it("rejects a line/road KMZ with a boundary-not-lines message", async () => {
    // mirrors a real "LayerToKML" road-network export: MultiGeometry of LineStrings, no polygon
    const roads = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark>
<MultiGeometry><LineString><coordinates>-0.16,5.81,0 -0.16,5.82,0</coordinates></LineString>
<LineString><coordinates>-0.16,5.82,0 -0.15,5.82,0</coordinates></LineString></MultiGeometry></Placemark></Document></kml>`;
    const file = await makeKmz("doc.kml", roads);
    await expect(
      parseParcelFile(file, { estateId: "check", fallbackPrice: 0, fallbackOwner: "You" }),
    ).rejects.toThrow(/closed land boundary/i);
  });
});

describe("parseParcelFile — polygon cap", () => {
  const poly = (i: number) => ({
    type: "Feature",
    properties: { plotNumber: `P-${i}` },
    geometry: { type: "Polygon", coordinates: [[[0, i], [0.001, i], [0.001, i + 0.001], [0, i + 0.001], [0, i]]] },
  });
  const geojsonFile = (n: number) =>
    new File([JSON.stringify({ type: "FeatureCollection", features: Array.from({ length: n }, (_, i) => poly(i)) })], "plots.geojson");

  it("rejects a file that exceeds the given cap", async () => {
    await expect(
      parseParcelFile(geojsonFile(3), { estateId: "e", fallbackPrice: 0, fallbackOwner: "X", maxFeatures: 2 }),
    ).rejects.toThrow(/more than the 2/i);
  });

  it("accepts a large multi-plot file under the (raised) default cap", async () => {
    const fc = await parseParcelFile(geojsonFile(600), { estateId: "e", fallbackPrice: 0, fallbackOwner: "X" });
    expect(fc.features).toHaveLength(600); // would have failed under the old 400 limit
  });
});

describe("polygonsOverlap", () => {
  const square = (x: number, y: number, s: number) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]];
  // an L-shape (non-convex): bottom arm y0–2, left arm x0–2, with a notch at x2–6/y2–6
  const L = [[0, 0], [6, 0], [6, 2], [2, 2], [2, 6], [0, 6], [0, 0]];

  it("detects two overlapping squares", () => {
    expect(polygonsOverlap(square(0, 0, 10), square(5, 5, 10))).toBe(true);
  });

  it("detects full containment", () => {
    expect(polygonsOverlap(square(0, 0, 100), square(40, 40, 10))).toBe(true);
  });

  it("does NOT flag edge-sharing neighbours (a normal subdivision)", () => {
    expect(polygonsOverlap(square(0, 0, 10), square(10, 0, 10))).toBe(false);
  });

  it("does NOT flag disjoint polygons", () => {
    expect(polygonsOverlap(square(0, 0, 10), square(20, 20, 10))).toBe(false);
  });

  it("handles a non-convex shape where intersectConvex would miss it", () => {
    expect(polygonsOverlap(L, square(1, 1, 2))).toBe(true); // straddles the L's arm
    expect(polygonsOverlap(L, square(3, 3, 2))).toBe(false); // sits in the notch, outside the L
  });
});

describe("convexHull", () => {
  it("wraps a set of points in their outer boundary, dropping interior points", () => {
    const hull = convexHull([
      [0, 0], [2, 0], [2, 2], [0, 2], // square corners
      [1, 1], // interior — must be excluded
    ]);
    expect(hull.length).toBe(5); // 4 corners + closing repeat
    expect(hull[0]).toEqual(hull[hull.length - 1]); // closed ring
    expect(hull.some((p) => p[0] === 1 && p[1] === 1)).toBe(false); // interior point excluded
  });

  it("handles a big cloud of points cheaply", () => {
    const pts = Array.from({ length: 1000 }, (_, i) => [Math.cos(i) * 0.01, Math.sin(i) * 0.01]);
    const hull = convexHull(pts);
    expect(hull.length).toBeGreaterThan(3);
    expect(ringAreaSqm(hull)).toBeGreaterThan(0);
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
