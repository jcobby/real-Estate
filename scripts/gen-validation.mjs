// Generates Zod schemas from the backend's OpenAPI request DTOs, so the
// frontend's form validation is a mirror of the backend's rules and can never
// silently drift. Run: `npm run gen:validation`.
//
// Reads the live spec at <API_BASE_URL>/docs-json and writes
// src/lib/api/validation.generated.ts (one schema per *Request DTO).
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.API_BASE_URL || "https://698zp0x7-3001.uks1.devtunnels.ms";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const res = await fetch(BASE + "/docs-json", { headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" } });
if (!res.ok) throw new Error(`Failed to fetch OpenAPI (${res.status}). Is the backend reachable at ${BASE}?`);
const spec = await res.json();
const schemas = spec.components?.schemas ?? {};

/** JSON-Schema property → Zod expression string. */
function build(s) {
  if (!s) return "z.any()";
  if (s.$ref) return "z.any()"; // referenced object — left loose on purpose
  if (Array.isArray(s.enum)) return `z.enum([${s.enum.map((v) => JSON.stringify(v)).join(", ")}])`;
  switch (s.type) {
    case "string": {
      let e = "z.string()";
      if (s.format === "email") e += ".email()";
      if (s.format === "uri") e += ".url()";
      if (s.minLength != null) e += `.min(${s.minLength})`;
      if (s.maxLength != null) e += `.max(${s.maxLength})`;
      if (s.pattern) e += `.regex(new RegExp(${JSON.stringify(s.pattern)}))`;
      return e;
    }
    case "integer":
    case "number": {
      let e = s.type === "integer" ? "z.number().int()" : "z.number()";
      if (s.minimum != null) e += `.min(${s.minimum})`;
      if (s.maximum != null) e += `.max(${s.maximum})`;
      return e;
    }
    case "boolean":
      return "z.boolean()";
    case "array": {
      let e = `z.array(${build(s.items)})`;
      if (s.minItems != null) e += `.min(${s.minItems})`;
      if (s.maxItems != null) e += `.max(${s.maxItems})`;
      return e;
    }
    case "object":
      if (s.properties) {
        const fields = Object.entries(s.properties).map(([k, v]) => `  ${JSON.stringify(k)}: ${field(v, s.required, k)}`);
        return `z.object({\n${fields.join(",\n")}\n})`;
      }
      return "z.record(z.string(), z.unknown())";
    default:
      return "z.any()";
  }
}

/** A single object field — adds `.optional()` when not required or has a default. */
function field(s, required, key) {
  const optional = !required?.includes(key) || s.default !== undefined;
  return build(s) + (optional ? ".optional()" : "");
}

const reqNames = Object.keys(schemas).filter((n) => /Request$/.test(n));
let out = `// AUTO-GENERATED from ${spec.info?.title ?? "the backend"} v${spec.info?.version ?? "?"} OpenAPI.\n`;
out += `// Do not edit by hand — run \`npm run gen:validation\` to refresh from the backend.\n`;
out += `import { z } from "zod";\n\n`;
for (const name of reqNames) {
  const varName = name.charAt(0).toLowerCase() + name.slice(1) + "Schema";
  out += `export const ${varName} = ${build(schemas[name])};\n\n`;
}

writeFileSync(resolve(root, "src/lib/api/validation.generated.ts"), out, "utf8");
console.log(`Wrote src/lib/api/validation.generated.ts — ${reqNames.length} request schemas.`);
