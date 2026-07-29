import { formatDistanceToNowStrict } from "date-fns";

const SQM_PER_ACRE = 4046.86;
const SQFT_PER_SQM = 10.7639;
/** A standard Ghanaian residential plot ≈ 100ft × 70ft. */
export const SQM_PER_PLOT = 650;

export function formatGHS(amount: number, opts: { compact?: boolean; decimals?: number } = {}) {
  const { compact = false, decimals = 0 } = opts;
  const formatted = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals,
    maximumFractionDigits: compact ? 1 : decimals,
  }).format(amount);
  // Intl renders "GH₵"; the brand style is a bare cedi sign.
  return formatted.replace("GH₵", "₵");
}

export function formatNumber(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-GH", opts).format(n);
}

export const sqmToSqft = (sqm: number) => sqm * SQFT_PER_SQM;
export const sqmToAcres = (sqm: number) => sqm / SQM_PER_ACRE;
export const acresToSqm = (acres: number) => acres * SQM_PER_ACRE;

export function formatSqm(sqm: number) {
  return `${formatNumber(Math.round(sqm))} m²`;
}

export function formatSqft(sqm: number) {
  return `${formatNumber(Math.round(sqmToSqft(sqm)))} ft²`;
}

export function formatAcres(sqm: number) {
  const acres = sqmToAcres(sqm);
  return `${formatNumber(acres, { maximumFractionDigits: acres < 1 ? 2 : 1 })} acres`;
}

/** "2 plots (0.32 acres)" style summary used across cards and panels. */
export function formatPlots(count: number) {
  return `${count} ${count === 1 ? "plot" : "plots"}`;
}

export function timeAgo(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function truncate(text: string, max = 90) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
