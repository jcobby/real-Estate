import { API_BASE } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a backend-hosted image through the app's own origin. The backend serves
 * uploads from the API host, which in dev sits behind the tunnel's anti-phishing gate
 * (and may be an http/localhost URL) — so a plain <img> can't load it. This proxy
 * fetches it server-side with the skip header and returns the bytes same-origin.
 * Locked to the configured API host (or localhost) to avoid being an open proxy.
 */
export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src");
  if (!src) return new Response("Missing src", { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new Response("Bad src", { status: 400 });
  }

  const base = API_BASE ? new URL(API_BASE) : null;
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(target.hostname);
  if (!base || (target.host !== base.host && !isLocalhost)) {
    return new Response("Forbidden host", { status: 403 });
  }
  // localhost URLs from the backend's local mode actually live on the API host
  if (isLocalhost) target = new URL(target.pathname + target.search, base);

  let upstream: Response;
  try {
    upstream = await fetch(target, { headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" }, cache: "no-store" });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) return new Response("Upstream error", { status: 502 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
