import type { ConflictResult, ParcelConflict } from "@/types";
import { ESTATES, getParcelCollection } from "@/data/estates";
import { bboxOverlap, intersectConvex, ringAreaSqm, ringBBox } from "@/lib/geo";
import { delay, getDb, uid } from "@/lib/mock/db";
import { buildConflictReportEmail, type BuiltEmail } from "@/lib/email/conflict-report";
import { LIVE, http, payload } from "./http";
import { pushNotification } from "./notifications";

/** id of the most recent live check — used to target the email endpoint. */
let lastCheckId: string | null = null;

/** All registered parcels (seeded estates + wizard-created), with their estate name. */
function allRegisteredParcels() {
  const out: Array<{ ring: number[][]; props: import("@/types").ParcelProperties; estateName: string }> = [];
  for (const e of ESTATES) {
    const fc = getParcelCollection(e.id);
    fc?.features.forEach((f) => out.push({ ring: f.geometry.coordinates[0], props: f.properties, estateName: e.name }));
  }
  const db = getDb();
  for (const e of db.customEstates) {
    const fc = db.customParcels[e.id];
    fc?.features.forEach((f) => out.push({ ring: f.geometry.coordinates[0], props: f.properties, estateName: e.name }));
  }
  return out;
}

/**
 * Check a boundary (closed lng/lat ring) against every registered parcel and
 * return the overlapping ones + the overlap geometry. Slivers < 1 m² are ignored.
 */
export async function checkLandConflict(ring: number[][]): Promise<ConflictResult> {
  if (LIVE) {
    const d = payload<Record<string, unknown>>(await http.post("/v1/land-checks", { ring }));
    const result = (d.conflicts !== undefined ? d : (d.result ?? d.check ?? d)) as unknown as ConflictResult & { id?: string };
    lastCheckId = (d.id as string) ?? (result as { id?: string }).id ?? lastCheckId;
    return result;
  }

  await delay(1300);
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring
    : [...ring, ring[0]];
  const searcherSqm = ringAreaSqm(closed);
  const sbb = ringBBox(closed);

  const conflicts: ParcelConflict[] = [];
  for (const { ring: pring, props, estateName } of allRegisteredParcels()) {
    if (!bboxOverlap(sbb, ringBBox(pring))) continue;
    const overlap = intersectConvex(closed, pring);
    if (overlap.length < 4) continue;
    const overlapSqm = ringAreaSqm(overlap);
    if (overlapSqm < 1) continue; // ignore edge-touch slivers
    conflicts.push({
      parcelId: props.id,
      plotNumber: props.plotNumber,
      owner: props.owner,
      estateId: props.estateId,
      estateName,
      status: props.status,
      overlapSqm: +overlapSqm.toFixed(1),
      overlapRings: [overlap],
    });
  }
  conflicts.sort((a, b) => b.overlapSqm - a.overlapSqm);

  return {
    searcherRing: closed,
    searcherSqm: +searcherSqm.toFixed(1),
    conflicts,
    totalOverlapSqm: +conflicts.reduce((s, c) => s + c.overlapSqm, 0).toFixed(1),
    clear: conflicts.length === 0,
  };
}

export interface SendReportInput {
  result: ConflictResult;
  email: string;
  name: string;
  /** when the searcher is signed in — used to push an in-app notification */
  userId?: string;
  /** id of the check to email (live); falls back to the last run check */
  checkId?: string;
}

/**
 * Emails the conflict report. Live: POST to the server email endpoint and still
 * build the exact email locally so the "Preview" button works. Mock: build the
 * email and return it for preview (no dispatch).
 */
export async function sendConflictReportEmail(input: SendReportInput): Promise<{ ok: true; reference: string } & BuiltEmail> {
  if (LIVE) {
    const id = input.checkId ?? lastCheckId;
    let reference = `LC-${new Date().getFullYear()}-${uid("").replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase()}`;
    if (id) {
      try {
        const d = payload<{ reference?: string }>(await http.post(`/v1/land-checks/${id}/email`, { name: input.name, email: input.email }));
        if (d.reference) reference = d.reference;
      } catch {
        /* keep the local reference; still show the preview */
      }
    }
    const email = buildConflictReportEmail({
      result: input.result,
      recipientName: input.name,
      recipientEmail: input.email,
      checkedAt: new Date(),
      reference,
    });
    return { ok: true, reference, ...email };
  }

  await delay(1400);
  const reference = `LC-${new Date().getFullYear()}-${uid("").replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase()}`;
  const email = buildConflictReportEmail({
    result: input.result,
    recipientName: input.name,
    recipientEmail: input.email,
    checkedAt: new Date(),
    reference,
  });
  if (input.userId) {
    pushNotification({
      userId: input.userId,
      type: "system",
      title: "Your land conflict report was emailed",
      body: `Sent to ${input.email} — ${input.result.clear ? "no conflicts found" : `${input.result.conflicts.length} conflict(s) flagged`}.`,
      href: "/land-check",
    });
  }
  return { ok: true, reference, ...email };
}
