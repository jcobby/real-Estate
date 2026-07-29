/**
 * Generates the parcel GeoJSON files in src/data/parcels/.
 * Deterministic (seeded PRNG) so re-running produces identical output.
 *
 *   node scripts/generate-parcels.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "data", "parcels");

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GH_OWNERS = [
  "Kofi Asante", "Ama Serwaa", "Yaw Boateng", "Efua Mensimah", "Kwabena Osei",
  "Akosua Frimpong", "Nana Yaa Danso", "Kwame Appiah", "Abena Nyarko", "Kojo Antwi",
  "Adwoa Baah", "Yaa Achiaa", "Fiifi Quartey", "Esi Cudjoe", "Kwesi Amankwah",
  "Maame Adjoa Sarpong", "Nii Armah Tetteh", "Dede Ayikailey", "Alhassan Iddrisu", "Fuseina Mahama",
];

/**
 * Build a rotated grid of plot polygons around a centre point.
 */
function buildEstate(cfg) {
  const rand = mulberry32(cfg.seed);
  const { center, cols, rows, rotationDeg, prefix, developer, basePrice } = cfg;

  const PLOT_W = 30.48; // metres (100 ft frontage)
  const PLOT_H = 21.34; // metres (70 ft depth)
  const ROAD_MINOR = 7; // metres between row pairs
  const ROAD_MAJOR = 10; // metres between column blocks

  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const theta = (rotationDeg * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Total footprint, to centre the grid on the given point.
  const totalW = cols * PLOT_W + Math.floor((cols - 1) / 3) * ROAD_MAJOR;
  const totalH = rows * PLOT_H + Math.floor((rows - 1) / 2) * ROAD_MINOR;

  const toLngLat = (xm, ym) => {
    // rotate in metre-space, then project onto degrees
    const rx = xm * cosT - ym * sinT;
    const ry = xm * sinT + ym * cosT;
    return [
      +(center.lng + rx / mPerDegLng).toFixed(7),
      +(center.lat + ry / mPerDegLat).toFixed(7),
    ];
  };

  const features = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      n++;
      // jitter the plot footprint a touch so the grid feels surveyed, not synthetic
      const w = PLOT_W * (0.96 + rand() * 0.1);
      const h = PLOT_H * (0.96 + rand() * 0.1);
      const x0 = c * PLOT_W + Math.floor(c / 3) * ROAD_MAJOR - totalW / 2;
      const y0 = r * PLOT_H + Math.floor(r / 2) * ROAD_MINOR - totalH / 2;

      const ring = [
        toLngLat(x0, y0),
        toLngLat(x0 + w, y0),
        toLngLat(x0 + w, y0 + h),
        toLngLat(x0, y0 + h),
        toLngLat(x0, y0),
      ];

      const roll = rand();
      const status = roll < cfg.availableShare ? "available" : roll < cfg.availableShare + 0.15 ? "reserved" : "sold";
      const owner =
        status === "sold"
          ? GH_OWNERS[Math.floor(rand() * GH_OWNERS.length)]
          : developer;
      const price = Math.round((basePrice * (0.92 + rand() * 0.2)) / 500) * 500;
      const areaSqm = +(w * h).toFixed(1);

      features.push({
        type: "Feature",
        properties: {
          id: `${cfg.id}-${String(n).padStart(3, "0")}`,
          estateId: cfg.id,
          plotNumber: `${prefix}-${String(n).padStart(3, "0")}`,
          owner,
          status,
          areaSqm,
          lengthM: +w.toFixed(2),
          breadthM: +h.toFixed(2),
          price,
        },
        geometry: { type: "Polygon", coordinates: [ring] },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

const ESTATES = [
  {
    id: "oyibi-hillcrest",
    file: "oyibi-hillcrest.json",
    seed: 11,
    center: { lat: 5.8265, lng: -0.0866 },
    cols: 9,
    rows: 8,
    rotationDeg: 14,
    prefix: "OY",
    developer: "Adom Lands & Estates Ltd",
    basePrice: 85000,
    availableShare: 0.55,
  },
  {
    id: "ejisu-royal",
    file: "ejisu-royal.json",
    seed: 23,
    center: { lat: 6.7196, lng: -1.4738 },
    cols: 8,
    rows: 8,
    rotationDeg: -9,
    prefix: "EJ",
    developer: "Asanteman Realty Group",
    basePrice: 48000,
    availableShare: 0.6,
  },
  {
    id: "sagnarigu-green",
    file: "sagnarigu-green.json",
    seed: 37,
    center: { lat: 9.4433, lng: -0.8983 },
    cols: 8,
    rows: 6,
    rotationDeg: 4,
    prefix: "SG",
    developer: "Northern Star Properties",
    basePrice: 26000,
    availableShare: 0.65,
  },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const cfg of ESTATES) {
  const fc = buildEstate(cfg);
  writeFileSync(join(OUT_DIR, cfg.file), JSON.stringify(fc));
  const counts = fc.features.reduce((acc, f) => {
    acc[f.properties.status] = (acc[f.properties.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`${cfg.id}: ${fc.features.length} plots`, counts);
}
