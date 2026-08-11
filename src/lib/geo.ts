import type { ParcelCollection, ParcelFeature, PlotStatus } from "@/types";

/**
 * Client-side parcel geometry tools for seller-created estates:
 * - generateParcelGrid: builds a subdivided plot grid around a centre point
 *   (same maths as scripts/generate-parcels.mjs, all plots start "available")
 * - parseParcelFile: reads a real GeoJSON or KML file of surveyed parcels
 */

const M_PER_DEG_LAT = 111_320;
const mPerDegLng = (lat: number) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GridConfig {
  estateId: string;
  center: { lat: number; lng: number };
  rows: number;
  cols: number;
  rotationDeg: number;
  /** Plot-number prefix, e.g. "AH" → AH-001 */
  prefix: string;
  price: number;
  owner: string;
}

export function generateParcelGrid(cfg: GridConfig): ParcelCollection {
  const seed = [...cfg.estateId].reduce((s, c) => s + c.charCodeAt(0), 7);
  const rand = mulberry32(seed);

  const PLOT_W = 30.48; // 100 ft frontage
  const PLOT_H = 21.34; // 70 ft depth
  const ROAD_MINOR = 7;
  const ROAD_MAJOR = 10;

  const mLng = mPerDegLng(cfg.center.lat);
  const theta = (cfg.rotationDeg * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const totalW = cfg.cols * PLOT_W + Math.floor((cfg.cols - 1) / 3) * ROAD_MAJOR;
  const totalH = cfg.rows * PLOT_H + Math.floor((cfg.rows - 1) / 2) * ROAD_MINOR;

  const toLngLat = (xm: number, ym: number): [number, number] => {
    const rx = xm * cosT - ym * sinT;
    const ry = xm * sinT + ym * cosT;
    return [+(cfg.center.lng + rx / mLng).toFixed(7), +(cfg.center.lat + ry / M_PER_DEG_LAT).toFixed(7)];
  };

  const features: ParcelFeature[] = [];
  let n = 0;
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      n++;
      const w = PLOT_W * (0.97 + rand() * 0.06);
      const h = PLOT_H * (0.97 + rand() * 0.06);
      const x0 = c * PLOT_W + Math.floor(c / 3) * ROAD_MAJOR - totalW / 2;
      const y0 = r * PLOT_H + Math.floor(r / 2) * ROAD_MINOR - totalH / 2;
      const ring: [number, number][] = [
        toLngLat(x0, y0),
        toLngLat(x0 + w, y0),
        toLngLat(x0 + w, y0 + h),
        toLngLat(x0, y0 + h),
        toLngLat(x0, y0),
      ];
      features.push({
        type: "Feature",
        properties: {
          id: `${cfg.estateId}-${String(n).padStart(3, "0")}`,
          estateId: cfg.estateId,
          plotNumber: `${cfg.prefix}-${String(n).padStart(3, "0")}`,
          owner: cfg.owner,
          status: "available",
          areaSqm: +(w * h).toFixed(1),
          lengthM: +w.toFixed(2),
          breadthM: +h.toFixed(2),
          price: cfg.price,
        },
        geometry: { type: "Polygon", coordinates: [ring] },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

/* ------------------------------------------------------------------ */
/* real-file parsing                                                    */
/* ------------------------------------------------------------------ */

/** Planar shoelace area on a metre-projected ring. */
export function ringAreaSqm(ring: number[][]): number {
  if (ring.length < 4) return 0;
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const lng0 = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const mLng = mPerDegLng(lat0);
  const pts = ring.map(([lng, lat]) => [(lng - lng0) * mLng, (lat - lat0) * M_PER_DEG_LAT]);
  let area = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  }
  return Math.abs(area / 2);
}

function edgeMeters(a: number[], b: number[]): number {
  const lat0 = (a[1] + b[1]) / 2;
  const dx = (b[0] - a[0]) * mPerDegLng(lat0);
  const dy = (b[1] - a[1]) * M_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/** Upper bound on polygons accepted from one uploaded survey file. Generous
 *  enough for a real large subdivision (~1,000 plots) while still refusing an
 *  absurd national dataset that would freeze the browser. */
export const MAX_PARCEL_FEATURES = 5000;

export interface ParseOptions {
  estateId: string;
  fallbackPrice: number;
  fallbackOwner: string;
  /** cap on how many polygons to accept from one file (default {@link MAX_PARCEL_FEATURES}). */
  maxFeatures?: number;
}

const STATUSES: PlotStatus[] = ["available", "reserved", "sold"];

function ringToFeature(ring: number[][], i: number, props: Record<string, unknown>, opts: ParseOptions): ParcelFeature {
  const areaSqm = +ringAreaSqm(ring).toFixed(1);
  // quadrilateral → true edge lengths; anything else → longest/shortest edge
  const edges = ring.slice(0, -1).map((p, j) => edgeMeters(p, ring[j + 1]));
  const lengthM = +Math.max(...edges).toFixed(2);
  const breadthM = +Math.min(...edges).toFixed(2);
  const rawStatus = String(props.status ?? "").toLowerCase() as PlotStatus;
  return {
    type: "Feature",
    properties: {
      id: `${opts.estateId}-${String(i + 1).padStart(3, "0")}`,
      estateId: opts.estateId,
      plotNumber: String(props.plotNumber ?? props.plot ?? props.number ?? props.name ?? `P-${String(i + 1).padStart(3, "0")}`),
      owner: String(props.owner ?? opts.fallbackOwner),
      status: STATUSES.includes(rawStatus) ? rawStatus : "available",
      areaSqm,
      lengthM,
      breadthM,
      price: Number(props.price) > 0 ? Number(props.price) : opts.fallbackPrice,
    },
    geometry: { type: "Polygon", coordinates: [ring as [number, number][]] },
  };
}

/** Build a parcel from a hand-drawn ring (the wizard's draw-plot tool). */
export function parcelFromRing(
  ring: number[][],
  index: number,
  opts: ParseOptions & { plotNumber?: string },
): ParcelFeature {
  return ringToFeature(ring, index, opts.plotNumber ? { plotNumber: opts.plotNumber } : {}, opts);
}

function parseGeoJson(text: string, opts: ParseOptions): ParcelFeature[] {
  const data = JSON.parse(text) as {
    type?: string;
    features?: Array<{ geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> }>;
  };
  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Expected a GeoJSON FeatureCollection of parcel polygons.");
  }
  const out: ParcelFeature[] = [];
  for (const f of data.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      out.push(ringToFeature((g.coordinates as number[][][])[0], out.length, f.properties ?? {}, opts));
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates as number[][][][]) {
        out.push(ringToFeature(poly[0], out.length, f.properties ?? {}, opts));
      }
    }
  }
  return out;
}

function parseKml(text: string, opts: ParseOptions): ParcelFeature[] {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("That KML file couldn't be parsed.");
  const out: ParcelFeature[] = [];
  doc.querySelectorAll("Placemark").forEach((pm) => {
    const name = pm.querySelector("name")?.textContent?.trim();
    pm.querySelectorAll("Polygon").forEach((poly) => {
      const coordText = poly.querySelector("outerBoundaryIs coordinates, coordinates")?.textContent?.trim();
      if (!coordText) return;
      const ring = coordText
        .split(/\s+/)
        .map((triple) => triple.split(",").slice(0, 2).map(Number))
        .filter((p) => p.length === 2 && p.every(Number.isFinite));
      if (ring.length < 4) return;
      // close the ring if the file left it open
      const closed =
        ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
          ? ring
          : [...ring, ring[0]];
      out.push(ringToFeature(closed, out.length, name ? { name } : {}, opts));
    });
  });
  return out;
}

/** Inflate raw-DEFLATE bytes with the browser's built-in DecompressionStream. */
async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  const done = new Response(ds.readable).arrayBuffer(); // start draining before we write
  void writer.write(bytes as BufferSource);
  void writer.close();
  return new Uint8Array(await done);
}

/**
 * Pull the KML document out of a KMZ (which is just a ZIP archive) — entirely in
 * the browser, no dependency. We read the ZIP's central directory for the first
 * `.kml` entry (preferring the root doc.kml), then inflate it when it's stored
 * with DEFLATE. Handles the two compression methods real exporters emit
 * (0 = stored, 8 = deflate).
 */
async function readKmzText(file: File): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser can't open KMZ files — unzip the .kml inside, or export GeoJSON.");
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = (o: number) => view.getUint16(o, true);
  const u32 = (o: number) => view.getUint32(o, true);
  const decoder = new TextDecoder("utf-8");

  // find the End-Of-Central-Directory record, scanning back over any trailing comment
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 0xffff; i--) {
    if (u32(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("That KMZ file isn't a valid archive — export GeoJSON instead.");

  const count = u16(eocd + 10); // total central-directory records
  let ptr = u32(eocd + 16); // offset of the first central-directory header
  let best: { offset: number; method: number; size: number } | null = null;
  for (let i = 0; i < count && ptr + 46 <= buf.length; i++) {
    if (u32(ptr) !== 0x02014b50) break;
    const method = u16(ptr + 10);
    const compSize = u32(ptr + 20);
    const nameLen = u16(ptr + 28);
    const extraLen = u16(ptr + 30);
    const commentLen = u16(ptr + 32);
    const localOff = u32(ptr + 42);
    const name = decoder.decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));
    if (/\.kml$/i.test(name)) {
      const isRootDoc = /(^|\/)doc\.kml$/i.test(name);
      if (!best || isRootDoc) best = { offset: localOff, method, size: compSize };
      if (isRootDoc) break; // the main document — stop looking
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  if (!best) throw new Error("No .kml layer found inside that KMZ file.");

  // the LOCAL header repeats the name/extra lengths (they can differ from the central dir)
  const dataStart = best.offset + 30 + u16(best.offset + 26) + u16(best.offset + 28);
  const data = buf.subarray(dataStart, dataStart + best.size);
  const bytes = best.method === 0 ? data : await inflateRaw(data);
  return decoder.decode(bytes);
}

/**
 * Explain WHY a file yielded no parcels. The usual cause isn't a broken file —
 * it's the wrong *kind* of geometry: a path/road network (lines) or map pins
 * (points) instead of a closed boundary. Say so, so the fix is obvious.
 */
function noPolygonError(text: string): Error {
  if (/LineString/i.test(text)) {
    return new Error(
      "That file has lines (a path or road network), not a closed land boundary. Draw the plot outline as a polygon/area — or type its corner coordinates instead.",
    );
  }
  if (/<Point\b|"Point"/i.test(text)) {
    return new Error(
      "That file has map pins (points), not a land boundary. Draw the plot outline as a polygon/area — or type its corner coordinates instead.",
    );
  }
  return new Error("No closed boundary (polygon) found in that file. Draw your plot as an area, or type its corner coordinates.");
}

/** Parse an uploaded parcel file (.geojson/.json/.kml/.kmz). */
export async function parseParcelFile(file: File, opts: ParseOptions): Promise<ParcelCollection> {
  const isKmz = /\.kmz$/i.test(file.name);
  const isKml = isKmz || /\.kml$/i.test(file.name);
  const text = isKmz ? await readKmzText(file) : await file.text();
  const features = isKml ? parseKml(text, opts) : parseGeoJson(text, opts);
  if (features.length === 0) {
    throw noPolygonError(text);
  }
  const max = opts.maxFeatures ?? MAX_PARCEL_FEATURES;
  if (features.length > max) {
    throw new Error(
      `That file has ${features.length.toLocaleString()} polygons — more than the ${max.toLocaleString()} we can handle at once.`,
    );
  }
  return { type: "FeatureCollection", features };
}

/**
 * Convex hull (Andrew's monotone chain) of a set of lng/lat points → a closed
 * ring. Used to check a many-polygon boundary as one combined footprint instead
 * of running a separate check per polygon.
 */
export function convexHull(points: number[][]): number[][] {
  const pts = points
    .filter((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map((p) => [p[0], p[1]] as Pt);
  if (pts.length < 3) return pts.length ? [...pts, pts[0]] : [];
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (src: Pt[]): Pt[] => {
    const out: Pt[] = [];
    for (const p of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop(); // drop the last point — it's the first of the other half
    return out;
  };
  const lower = half(pts);
  const upper = half([...pts].reverse());
  const hull = [...lower, ...upper];
  return [...hull, hull[0]]; // close the ring
}

/** Bounding-box centre of a collection — used as the estate's map centre. */
export function collectionCenter(fc: ParcelCollection): { lat: number; lng: number } {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const f of fc.features) {
    for (const [lng, lat] of f.geometry.coordinates[0]) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { lat: +((minLat + maxLat) / 2).toFixed(6), lng: +((minLng + maxLng) / 2).toFixed(6) };
}

/* ------------------------------------------------------------------ */
/* polygon overlap — used by the land-conflict checker                 */
/* ------------------------------------------------------------------ */

type Pt = [number, number];

/**
 * Order corner points around their centroid so a set of corners — tapped or
 * typed in any order — forms a clean, non-self-intersecting polygon. Correct
 * for the convex plots buyers and sellers define.
 */
export function orderRing(points: number[][]): number[][] {
  if (points.length < 3) return points;
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

/** Drop a trailing closing vertex so a ring is a clean vertex list. */
function openRing(ring: number[][]): Pt[] {
  const r = ring.map((p) => [p[0], p[1]] as Pt);
  if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  return r;
}

function signedArea(ring: Pt[]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** Axis-aligned bounding box [minX, minY, maxX, maxY] of a ring. */
export function ringBBox(ring: number[][]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

export function bboxOverlap(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/**
 * Intersection of a subject polygon with a CONVEX clip polygon
 * (Sutherland–Hodgman). Registered parcels are convex quadrilaterals, so this
 * yields the correct overlap region. Returns a closed ring, or [] if disjoint.
 */
export function intersectConvex(subjectRing: number[][], clipRing: number[][]): Pt[] {
  let output = openRing(subjectRing);
  let clip = openRing(clipRing);
  if (clip.length < 3 || output.length < 3) return [];
  if (signedArea(clip) < 0) clip = [...clip].reverse(); // normalise to CCW → inside = left of edge

  const inside = (p: Pt, a: Pt, b: Pt) =>
    (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-13;

  const cut = (s: Pt, e: Pt, a: Pt, b: Pt): Pt => {
    const dcx = a[0] - b[0], dcy = a[1] - b[1];
    const dpx = s[0] - e[0], dpy = s[1] - e[1];
    const n1 = a[0] * b[1] - a[1] * b[0];
    const n2 = s[0] * e[1] - s[1] * e[0];
    const denom = dcx * dpy - dcy * dpx;
    if (Math.abs(denom) < 1e-20) return e;
    return [(n1 * dpx - n2 * dcx) / denom, (n1 * dpy - n2 * dcy) / denom];
  };

  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const curIn = inside(cur, a, b);
      const prevIn = inside(prev, a, b);
      if (curIn) {
        if (!prevIn) output.push(cut(prev, cur, a, b));
        output.push(cur);
      } else if (prevIn) {
        output.push(cut(prev, cur, a, b));
      }
    }
    if (output.length === 0) return [];
  }
  // close the ring for downstream area/render use
  return output.length >= 3 ? [...output, output[0]] : [];
}

/** Point strictly inside a ring (ray casting). A point ON the boundary counts as outside. */
function pointInRing(p: Pt, ring: Pt[]): boolean {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (Math.abs(cross) <= 1e-12 &&
        Math.min(a[0], b[0]) - 1e-12 <= p[0] && p[0] <= Math.max(a[0], b[0]) + 1e-12 &&
        Math.min(a[1], b[1]) - 1e-12 <= p[1] && p[1] <= Math.max(a[1], b[1]) + 1e-12) {
      return false; // on an edge → boundary, not strictly inside
    }
  }
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][1], yj = ring[j][1];
    if ((yi > p[1]) !== (yj > p[1])) {
      const xAt = ((ring[j][0] - ring[i][0]) * (p[1] - yi)) / (yj - yi) + ring[i][0];
      if (p[0] < xAt) inside = !inside;
    }
  }
  return inside;
}

/** True only when two segments cross at a point interior to both (not merely touching/collinear). */
function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const dir = (p: Pt, q: Pt, r: Pt) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  const d1 = dir(a, b, c), d2 = dir(a, b, d), d3 = dir(c, d, a), d4 = dir(c, d, b);
  return d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0 && d1 !== d2 && d3 !== d4;
}

/**
 * Do two polygons share interior area? Works for ARBITRARY rings — including the
 * non-convex, irregular parcels real survey files produce — where {@link intersectConvex}
 * (convex-only) silently misses overlaps. Deliberately does NOT flag plots that merely
 * share an edge or a corner, so a normal subdivision grid isn't falsely flagged.
 */
export function polygonsOverlap(ringA: number[][], ringB: number[][]): boolean {
  if (!bboxOverlap(ringBBox(ringA), ringBBox(ringB))) return false;
  const a = openRing(ringA), b = openRing(ringB);
  if (a.length < 3 || b.length < 3) return false;
  for (const p of a) if (pointInRing(p, b)) return true;
  for (const p of b) if (pointInRing(p, a)) return true;
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i], a2 = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j++) {
      if (segmentsCross(a1, a2, b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return false;
}
