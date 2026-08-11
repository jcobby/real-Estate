import { API_BASE, LIVE, http, payload } from "./http";

/** The backend's "local" upload mode returns http://localhost:PORT URLs. From the
 *  browser those hit the wrong host (and break mixed-content on an https page), so
 *  re-point any localhost or root-relative URL at the configured API base. */
function toApiHost(url: string): string {
  if (!url) return url;
  if (url.startsWith("/")) return API_BASE + url;
  try {
    const u = new URL(url);
    if (API_BASE && /^(localhost|127\.0\.0\.1)$/i.test(u.hostname)) return API_BASE + u.pathname + u.search;
  } catch {
    /* not an absolute URL — leave as-is */
  }
  return url;
}

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

  // Upload the bytes to the backend's signed URL (re-pointed to the API host — the
  // backend's local mode hands back localhost URLs the browser can't reach). A failed
  // upload throws so the caller can tell the user, not keep a broken/placeholder image.
  if (signed.mode !== "sandbox" && signed.uploadUrl) {
    const uploadUrl = toApiHost(signed.uploadUrl);
    const headers: Record<string, string> = { ...(signed.headers ?? {}) };
    // our own API host sits behind the dev-tunnel anti-phishing gate (browser PUT too)
    if (API_BASE && uploadUrl.startsWith(API_BASE)) headers["X-Tunnel-Skip-AntiPhishing-Page"] = "true";
    const res = await fetch(uploadUrl, { method: signed.method || "PUT", headers, body: file });
    if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status}).`);
  }

  // The stored/public URL comes from the backend, re-pointed to a host the browser can reach.
  return { storageKey: signed.storageKey, publicUrl: toApiHost(signed.publicUrl), previewUrl };
}
