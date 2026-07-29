import { LIVE, http, payload } from "./http";

/** Matches the backend RequestUploadSignRequest.purpose enum. */
export type UploadPurpose = "listing-image" | "verification-doc" | "estate-geojson" | "avatar" | "other";

export interface UploadResult {
  /** Key to attach to create endpoints (documents, avatars, …). */
  storageKey: string;
  /** Stored URL the backend will serve the file from (once real storage is live). */
  publicUrl: string;
  /** Local object URL of the picked file — for an instant in-session preview. */
  previewUrl: string;
}

interface SignResponse {
  storageKey: string;
  publicUrl: string;
  uploadUrl?: string;
  method?: string;
  headers?: Record<string, string>;
  mode?: string;
}

/**
 * Upload a file via the backend's signed-URL flow:
 *   1. POST /v1/uploads/sign → { uploadUrl, storageKey, publicUrl, mode }
 *   2. real mode: PUT the bytes to uploadUrl. Sandbox: skip (per backend
 *      instructions) and use storageKey / publicUrl directly.
 * Returns the stored references plus a local preview URL for immediate display.
 * Without a live backend it keeps a placeholder for storage and the real file
 * for preview, so the mock flow still looks right.
 */
export async function uploadFile(file: File, purpose: UploadPurpose): Promise<UploadResult> {
  const previewUrl =
    typeof URL !== "undefined" && "createObjectURL" in URL ? URL.createObjectURL(file) : "";

  if (!LIVE) {
    const seed = Math.random().toString(36).slice(2, 9);
    return { storageKey: `mock/${purpose}/${file.name}`, publicUrl: `https://picsum.photos/seed/${seed}/800/600`, previewUrl };
  }

  const signed = payload<SignResponse>(
    await http.post("/v1/uploads/sign", {
      purpose,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
  );

  // Real storage: upload the bytes and use the URL the backend serves them from.
  if (signed.mode !== "sandbox" && signed.uploadUrl) {
    await fetch(signed.uploadUrl, { method: signed.method || "PUT", headers: signed.headers, body: file });
    return { storageKey: signed.storageKey, publicUrl: signed.publicUrl, previewUrl };
  }

  // Sandbox: the backend returns a placeholder host (cdn.example.com) that doesn't
  // actually serve the file, so the image would be broken. For listing photos we
  // stand in with a real curated image so the listing shows something; the seller
  // still sees their own picture in the wizard (previewUrl). Real uploads take over
  // automatically once the backend wires real file storage.
  if (purpose === "listing-image") {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const n = String(1 + Math.floor(Math.random() * 9)).padStart(2, "0");
    return { storageKey: signed.storageKey, publicUrl: `${origin}/lands/land-${n}.jpg`, previewUrl };
  }

  return { storageKey: signed.storageKey, publicUrl: signed.publicUrl, previewUrl };
}
