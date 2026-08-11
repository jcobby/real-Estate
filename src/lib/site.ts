/**
 * Canonical public origin for metadata, robots and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL to your real domain in production (no trailing slash);
 * the placeholder below only keeps builds working before the domain is decided.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://realestate-gh.example.com").replace(/\/+$/, "");
