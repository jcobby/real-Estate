/**
 * Real-backend HTTP client.
 *
 * The mock service layer (every other file in this folder) calls into this when
 * `NEXT_PUBLIC_API_BASE_URL` is set — otherwise each function keeps using the
 * in-browser mock DB. So live vs mock is a single env-var switch and nothing
 * breaks if the API is unreachable and the var is removed.
 *
 * Envelope contract (see docs/SPECIFICATION.md §13):
 *   success → { data: <payload>, meta: { requestId } }
 *   error   → { error: { code, message, fieldErrors?, requestId, timestamp } }
 * Lists    → data.items (+ total/page/pageSize/totalPages when paged)
 * Detail   → data.<resource> (e.g. data.listing)
 */

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const API_BASE = RAW_BASE.replace(/\/+$/, "");
/** True when a real backend is configured; the api modules branch on this. */
export const LIVE = API_BASE.length > 0;

const SESSION_KEY = "realestate:session";
const isServer = typeof window === "undefined";
/** Abort a request that hangs (e.g. the backend/tunnel is unreachable). */
const REQUEST_TIMEOUT_MS = 20_000;

/* --------------------------------------------------------------- auth token */

let memToken: string | null = null;

/** Called by auth.login/register so the token is usable before the store persists. */
export function setAuthToken(token: string | null) {
  memToken = token;
}

function readStoredToken(): string | null {
  if (isServer) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.session?.token ?? null;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return memToken ?? readStoredToken();
}

/** Best-effort: keep the persisted session's token in sync after a refresh. */
function writeStoredToken(token: string) {
  if (isServer) return;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state?.session) {
      parsed.state.session.token = token;
      localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
  } catch {
    /* ignore */
  }
}

/** Event the app listens for to sign the user out + redirect when a session dies. */
export const SESSION_EXPIRED_EVENT = "realestate:session-expired";

/** Drop the dead session so the app stops replaying an expired token. */
function clearStoredSession() {
  memToken = null;
  if (isServer) return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  // fire immediately so the UI reacts even if a query's retry swallows the error
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

/* --------------------------------------------------------------- error type */

export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(code: string, message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Turn any thrown error into a short, human-readable message for a toast. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.fieldErrors) {
      const first = Object.values(error.fieldErrors).find(Boolean);
      if (first) return first;
    }
    return error.message || "Something went wrong.";
  }
  if (error instanceof Error) return error.message || "Something went wrong.";
  return "Something went wrong.";
}

/* ------------------------------------------------------------------ request */

type Query = Record<string, string | number | boolean | string[] | null | undefined>;

interface ReqOpts {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  /** send Authorization header (default: whenever a token exists) */
  auth?: boolean;
  _retried?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === null || v === undefined || v === "" || v === "all") continue;
      if (Array.isArray(v)) {
        for (const item of v) if (item !== "" && item != null) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

async function raw(path: string, opts: ReqOpts = {}): Promise<unknown> {
  const headers: Record<string, string> = { "X-Tunnel-Skip-AntiPhishing-Page": "true" };
  // The dev-tunnel anti-phishing interstitial blocks requests without this
  // header (browser fetch included); the backend CORS allow-lists it. When the
  // API moves off the dev tunnel to a real host, the header is simply ignored.
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token && opts.auth !== false) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const aborted = (err as { name?: string })?.name === "AbortError";
    throw new ApiError(
      aborted ? "TIMEOUT" : "NETWORK",
      aborted
        ? "The server took too long to respond. Please try again."
        : "Can't reach the server — check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  // Access token expired → try the refresh cookie once, then replay. If refresh
  // isn't possible, the session is dead — surface a clean SESSION_EXPIRED so the
  // app can sign the user out instead of showing a raw 401.
  if (res.status === 401 && token) {
    if (!opts._retried) {
      const refreshed = await tryRefresh();
      if (refreshed) return raw(path, { ...opts, _retried: true });
    }
    clearStoredSession();
    throw new ApiError("SESSION_EXPIRED", "Your session expired — please sign in again.", 401);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (json as { error?: { code?: string; message?: string; fieldErrors?: Record<string, string> } })?.error;
    throw new ApiError(e?.code ?? "SERVER_ERROR", e?.message ?? res.statusText ?? "Request failed", res.status, e?.fieldErrors);
  }
  return json;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "X-Tunnel-Skip-AntiPhishing-Page": "true" };
    const res = await fetch(API_BASE + "/v1/auth/refresh", { method: "POST", headers, credentials: "include", cache: "no-store" });
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    const token = (json as { data?: { accessToken?: string } })?.data?.accessToken;
    if (token) {
      setAuthToken(token);
      writeStoredToken(token);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

/* ------------------------------------------------------------ unwrap helpers */

function dataOf(json: unknown): Record<string, unknown> {
  return ((json as { data?: unknown })?.data ?? {}) as Record<string, unknown>;
}

/** Detail endpoints: data.<key> (with a single-key fallback if the name differs). */
export function one<T>(json: unknown, key: string): T | null {
  const d = dataOf(json);
  if (d[key] !== undefined) return d[key] as T;
  const vals = Object.values(d);
  if (vals.length === 1) return vals[0] as T;
  return (Object.keys(d).length ? (d as unknown as T) : null);
}

/** List endpoints: data.items. */
export function many<T>(json: unknown): T[] {
  const d = dataOf(json);
  return (d.items as T[]) ?? [];
}

/** Paged endpoints: normalise data → Paged<T>. */
export function paged<T>(json: unknown): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const d = dataOf(json);
  const items = (d.items as T[]) ?? [];
  return {
    items,
    total: (d.total as number) ?? items.length,
    page: (d.page as number) ?? 1,
    pageSize: (d.pageSize as number) ?? items.length,
    totalPages: (d.totalPages as number) ?? 1,
  };
}

/** Return the whole data object (for multi-key responses like purchase + payment). */
export function payload<T = Record<string, unknown>>(json: unknown): T {
  return dataOf(json) as T;
}

/* -------------------------------------------------------------- verb helpers */

export const http = {
  get: (path: string, query?: Query) => raw(path, { method: "GET", query }),
  post: (path: string, body?: unknown, query?: Query) => raw(path, { method: "POST", body, query }),
  patch: (path: string, body?: unknown) => raw(path, { method: "PATCH", body }),
  del: (path: string, body?: unknown) => raw(path, { method: "DELETE", body }),
};
