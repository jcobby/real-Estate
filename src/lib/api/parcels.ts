import type { Estate, ParcelCollection, ParcelFeature, PlotStatus } from "@/types";
import { ESTATES, getParcelCollection } from "@/data/estates";
import { delay, getDb, mutateDb } from "@/lib/mock/db";
import { LIVE, http, many, one, payload } from "./http";
import { normalizeParcels } from "./normalize";

/** Seeded estates + any created through the listing wizard. */
export async function getEstates(): Promise<Estate[]> {
  if (LIVE) return many<Estate>(await http.get("/v1/estates"));
  await delay(150);
  return [...ESTATES, ...getDb().customEstates];
}

/** Static or wizard-created GeoJSON, merged with any status overrides from the mock DB. */
export async function getParcels(estateId: string): Promise<ParcelCollection | null> {
  if (LIVE) {
    const fc = payload<ParcelCollection>(await http.get(`/v1/estates/${estateId}/parcels`));
    return normalizeParcels(fc?.features ? fc : null);
  }
  await delay(200);
  const base = getParcelCollection(estateId) ?? getDb().customParcels[estateId];
  if (!base) return null;
  const overrides = getDb().parcelOverrides;
  return {
    type: "FeatureCollection",
    features: base.features.map((f) =>
      overrides[f.properties.id]
        ? { ...f, properties: { ...f.properties, status: overrides[f.properties.id] } }
        : f,
    ),
  };
}

export async function getParcelById(parcelId: string): Promise<ParcelFeature | null> {
  if (LIVE) return one<ParcelFeature>(await http.get(`/v1/parcels/${parcelId}`), "parcel");
  const estateId = parcelId.split("-").slice(0, -1).join("-");
  const fc = await getParcels(estateId);
  return fc?.features.find((f) => f.properties.id === parcelId) ?? null;
}

export function setParcelStatuses(parcelIds: string[], status: PlotStatus) {
  if (LIVE) {
    // Backend sets plot status atomically on purchase; this is a best-effort
    // optimistic nudge for any direct caller.
    for (const id of parcelIds) http.patch(`/v1/parcels/${id}/status`, { status }).catch(() => {});
    return;
  }
  mutateDb((db) => {
    for (const id of parcelIds) db.parcelOverrides[id] = status;
  });
}

/** Publish a wizard-created estate: buyers can then pick its plots on /map. */
export async function createEstate(estate: Estate, parcels: ParcelCollection): Promise<Estate> {
  if (LIVE) {
    // the backend wants a plain array of GeoJSON features, not the collection object
    return (one<Estate>(await http.post("/v1/estates", { ...estate, parcels: parcels.features }), "estate")) as Estate;
  }
  await delay(400);
  mutateDb((db) => {
    db.customEstates = [...db.customEstates.filter((e) => e.id !== estate.id), estate];
    db.customParcels[estate.id] = parcels;
  });
  return estate;
}
