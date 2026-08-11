/**
 * Generates one clean, self-contained product image per material category into
 * public/materials/<category>.svg. Colours match CATEGORY_META so the shop reads
 * as a consistent catalog. Run: npm run generate:material-images
 *
 * Why images live here (not on the backend): the API has no material-image field,
 * so every material — seeded or seller-created — resolves its picture from its
 * category on the frontend. Drop a real photo at public/materials/<category>.jpg
 * and point the resolver at it to override a category with a real photograph.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "materials");
mkdirSync(OUT, { recursive: true });

// category -> { bg gradient stops, product colour, accent }
const C = {
  cement:          { from: "#eceae7", to: "#b8b2ab", fg: "#4b463f", accent: "#d9534f" },
  blocks:          { from: "#fbe6d2", to: "#dda56d", fg: "#7c3f16", accent: "#a35a26" },
  roofing:         { from: "#dfeaf7", to: "#89aede", fg: "#274a7a", accent: "#c0392b" },
  steel:           { from: "#e8ecf1", to: "#9aa6b4", fg: "#3a4655", accent: "#6b7684" },
  aggregates:      { from: "#efece1", to: "#c6b686", fg: "#5c4d1f", accent: "#8a7638" },
  timber:          { from: "#e4f0e6", to: "#8bb894", fg: "#3a6145", accent: "#a9723f" },
  plumbing:        { from: "#d7f1f4", to: "#79c6cf", fg: "#125a60", accent: "#2b8a92" },
  electrical:      { from: "#fef1c8", to: "#f0bf46", fg: "#7a5610", accent: "#c0392b" },
  paint:           { from: "#f7dde8", to: "#dd93b6", fg: "#7a2f52", accent: "#2f6fb0" },
  tools:           { from: "#e6e9ee", to: "#9aa3af", fg: "#333c49", accent: "#d98a24" },
  "doors-windows": { from: "#f1e3d1", to: "#cbaa79", fg: "#5f4527", accent: "#3b6ea5" },
  tiles:           { from: "#dcf1ed", to: "#83c8bc", fg: "#1f5a50", accent: "#2b8a92" },
};

const W = 600, H = 360, CX = 300;

/** Common frame: gradient bg, top-left light, soft ground shadow. */
function frame(id, from, to, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="lite${id}" cx="0.28" cy="0.22" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg${id})"/>
  <rect width="${W}" height="${H}" fill="url(#lite${id})"/>
  <ellipse cx="${CX}" cy="298" rx="150" ry="24" fill="#000000" opacity="0.14"/>
  ${inner}
</svg>`;
}

const shade = "rgba(0,0,0,0.22)";
const hi = "rgba(255,255,255,0.5)";

// ---- per-category product art (centred around x=300, ground ~y=292) ----
const ART = {
  cement: (c) => `
    ${bag(210, 150, c)}
    ${bag(330, 120, c, true)}`,
  blocks: (c) => `
    ${block(212, 210, c)}${block(320, 210, c)}
    ${block(266, 128, c)}`,
  roofing: (c) => {
    let ridges = "";
    for (let i = 0; i < 9; i++) ridges += `<path d="M${180 + i * 26} 120 L${192 + i * 26} 110 L${192 + i * 26} 250 L${180 + i * 26} 262 Z" fill="${i % 2 ? c.fg : shade}" opacity="${i % 2 ? 1 : 0.5}"/>`;
    return `<g>${ridges}<path d="M180 120 L400 120 L412 110 L192 110 Z" fill="${hi}"/></g>`;
  },
  steel: (c) => {
    let rods = "";
    for (let i = 0; i < 6; i++) {
      const x = 200 + i * 34;
      rods += `<rect x="${x}" y="110" width="16" height="180" rx="8" fill="${c.fg}"/><rect x="${x}" y="110" width="5" height="180" fill="${hi}" opacity="0.5"/>`;
      for (let r = 0; r < 6; r++) rods += `<rect x="${x - 2}" y="${124 + r * 28}" width="20" height="5" rx="2" fill="${shade}"/>`;
    }
    return `<g>${rods}</g>`;
  },
  aggregates: (c) => {
    let dots = "";
    const pts = [[300, 150], [250, 200], [352, 205], [220, 250], [300, 235], [380, 252], [270, 270], [330, 268], [190, 275], [410, 276]];
    for (const [x, y] of pts) dots += `<circle cx="${x}" cy="${y}" r="26" fill="${c.fg}"/><circle cx="${x - 7}" cy="${y - 8}" r="8" fill="${hi}" opacity="0.45"/>`;
    return `<g><path d="M170 288 L300 150 L430 288 Z" fill="${c.fg}" opacity="0.35"/>${dots}</g>`;
  },
  timber: (c) => {
    let planks = "";
    for (let i = 0; i < 3; i++) {
      const y = 150 + i * 46;
      planks += `<rect x="176" y="${y}" width="248" height="40" rx="5" fill="${c.fg}"/><rect x="176" y="${y}" width="248" height="9" fill="${hi}" opacity="0.35"/>`;
      planks += `<ellipse cx="410" cy="${y + 20}" rx="10" ry="18" fill="${shade}"/>`;
    }
    return `<g>${planks}</g>`;
  },
  plumbing: (c) => `
    <path d="M220 130 h46 v70 h70 v46 h-70 a46 46 0 0 1 -46 -46 Z" fill="${c.fg}"/>
    <rect x="214" y="118" width="58" height="24" rx="6" fill="${c.accent}"/>
    <rect x="330" y="238" width="24" height="58" rx="6" fill="${c.accent}"/>
    <path d="M232 140 v56" stroke="${hi}" stroke-width="6" fill="none" opacity="0.5"/>`,
  electrical: (c) => {
    let loops = "";
    for (let i = 0; i < 4; i++) loops += `<ellipse cx="290" cy="200" rx="${110 - i * 22}" ry="${74 - i * 15}" fill="none" stroke="${c.fg}" stroke-width="14"/>`;
    return `<g>${loops}<rect x="360" y="150" width="60" height="44" rx="8" fill="${c.accent}"/><rect x="372" y="140" width="8" height="14" fill="${c.fg}"/><rect x="398" y="140" width="8" height="14" fill="${c.fg}"/></g>`;
  },
  paint: (c) => `
    <path d="M228 168 h96 l-10 118 a8 8 0 0 1 -8 7 h-62 a8 8 0 0 1 -8 -7 Z" fill="${c.fg}"/>
    <rect x="222" y="150" width="108" height="24" rx="8" fill="${c.fg}"/>
    <path d="M240 150 q36 -30 72 0" fill="none" stroke="${shade}" stroke-width="6"/>
    <rect x="238" y="196" width="80" height="30" rx="4" fill="${c.accent}"/>
    <g><rect x="352" y="150" width="52" height="26" rx="6" fill="${c.accent}"/><rect x="374" y="176" width="8" height="40" fill="${c.fg}"/><rect x="360" y="216" width="36" height="70" rx="8" fill="${c.fg}"/></g>`,
  tools: (c) => `
    <g transform="rotate(38 300 210)"><rect x="292" y="120" width="18" height="180" rx="8" fill="${c.fg}"/><rect x="256" y="112" width="90" height="40" rx="8" fill="${c.accent}"/></g>
    <g transform="rotate(-40 300 210)"><rect x="291" y="150" width="18" height="150" rx="8" fill="${c.fg}"/><path d="M282 120 a24 24 0 1 0 36 0 l-9 16 h-18 Z" fill="${c.fg}"/><circle cx="300" cy="132" r="9" fill="${c.to}"/></g>`,
  "doors-windows": (c) => `
    <rect x="176" y="120" width="120" height="176" rx="6" fill="${c.fg}"/>
    <rect x="190" y="134" width="92" height="70" rx="4" fill="${shade}"/>
    <rect x="190" y="214" width="92" height="70" rx="4" fill="${shade}"/>
    <circle cx="284" cy="210" r="6" fill="${c.accent}"/>
    <rect x="322" y="150" width="118" height="118" rx="6" fill="${c.accent}"/>
    <rect x="334" y="162" width="94" height="94" fill="${c.from}"/>
    <rect x="376" y="162" width="10" height="94" fill="${c.fg}"/>
    <rect x="334" y="204" width="94" height="10" fill="${c.fg}"/>`,
  tiles: (c) => {
    let grid = "";
    for (let r = 0; r < 3; r++) for (let col = 0; col < 4; col++) grid += `<rect x="${182 + col * 60}" y="${140 + r * 50}" width="52" height="42" rx="5" fill="${c.fg}" opacity="${0.75 + ((r + col) % 2) * 0.25}"/>`;
    return `<g>${grid}<path d="M182 140 L182 290 L422 140 Z" fill="${hi}" opacity="0.14"/></g>`;
  },
};

function bag(x, topY, c, back = false) {
  const w = 130;
  const fill = back ? c.to : c.fg;
  return `<g>
    <rect x="${x - w / 2}" y="${topY}" width="${w}" height="${292 - topY}" rx="10" fill="${fill}"/>
    <rect x="${x - w / 2}" y="${topY}" width="${w}" height="16" rx="8" fill="${shade}"/>
    <rect x="${x - w / 2}" y="${topY + 46}" width="${w}" height="40" fill="${c.from}" opacity="0.9"/>
    <rect x="${x - w / 2 + 20}" y="${topY + 56}" width="${w - 40}" height="8" rx="4" fill="${c.accent}"/>
    <rect x="${x - w / 2 + 20}" y="${topY + 70}" width="${w - 64}" height="6" rx="3" fill="${shade}"/>
  </g>`;
}

function block(x, topY, c) {
  const w = 96, h = 82;
  return `<g>
    <rect x="${x - w / 2}" y="${topY}" width="${w}" height="${h}" rx="4" fill="${c.fg}"/>
    <rect x="${x - w / 2 + 12}" y="${topY + 14}" width="26" height="${h - 28}" rx="3" fill="${shade}"/>
    <rect x="${x + 6}" y="${topY + 14}" width="26" height="${h - 28}" rx="3" fill="${shade}"/>
    <rect x="${x - w / 2}" y="${topY}" width="${w}" height="8" rx="4" fill="${hi}" opacity="0.35"/>
  </g>`;
}

let n = 0;
for (const [cat, c] of Object.entries(C)) {
  const svg = frame(n++, c.from, c.to, ART[cat](c));
  writeFileSync(join(OUT, `${cat}.svg`), svg.replace(/\n\s+/g, "\n"));
}
console.log(`Generated ${n} category images → public/materials/`);
