import type { ConflictResult } from "@/types";
import { formatAcres, formatDateTime, formatSqft, formatSqm } from "@/lib/format";

/**
 * Builds a polished, self-contained HTML email (table layout + inline styles for
 * broad email-client support) reporting a land conflict check. In production the
 * `html` string is handed to a transactional provider (Resend/SendGrid) from a
 * server route; in this sandbox it's rendered for preview.
 */
export interface ConflictEmailInput {
  result: ConflictResult;
  recipientName: string;
  recipientEmail: string;
  checkedAt?: Date;
  reference?: string;
  appUrl?: string;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  green: "#22402f",
  greenSoft: "#2f5842",
  gold: "#f5a623",
  goldInk: "#3d2e00",
  ink: "#1f2a24",
  muted: "#6b7772",
  bg: "#eef1ee",
  card: "#ffffff",
  success: "#2e7d5b",
  successBg: "#e7f4ee",
  danger: "#c0392b",
  dangerBg: "#fbeae7",
  amber: "#b8791b",
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function statTile(label: string, value: string, accent = BRAND.ink): string {
  return `
    <td width="50%" style="padding:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f6;border:1px solid #e6eae7;border-radius:12px;">
        <tr><td style="padding:14px 16px;">
          <div style="font:600 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</div>
          <div style="font:700 20px/1.25 Arial,Helvetica,sans-serif;color:${accent};margin-top:4px;">${esc(value)}</div>
        </td></tr>
      </table>
    </td>`;
}

export function buildConflictReportEmail(input: ConflictEmailInput): BuiltEmail {
  const { result } = input;
  const checkedAt = input.checkedAt ?? new Date();
  const reference =
    input.reference ??
    `LC-${checkedAt.getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
  const appUrl = input.appUrl ?? "https://realestate-gh.example.com";
  const firstName = input.recipientName.split(" ")[0] || "there";
  const conflict = !result.clear;

  const subject = conflict
    ? `⚠️ Conflict found — your land overlaps ${result.conflicts.length} registered plot${result.conflicts.length > 1 ? "s" : ""} · ${reference}`
    : `✓ No conflicts found for your land check · ${reference}`;

  const preheader = conflict
    ? `Your boundary overlaps ${result.conflicts.length} registered plot(s) — ${formatSqm(result.totalOverlapSqm)} of overlap. See the full breakdown.`
    : `Good news — your boundary doesn't overlap any registered plot on RealEstate.`;

  // verdict hero
  const verdict = conflict
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.dangerBg};border:1px solid #f3c9c1;border-radius:14px;">
        <tr><td style="padding:18px 20px;">
          <div style="font:700 18px/1.3 Arial,Helvetica,sans-serif;color:${BRAND.danger};">⚠&nbsp; Conflict detected</div>
          <div style="font:400 14px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink};margin-top:6px;">
            Your boundary overlaps <strong>${result.conflicts.length} registered plot${result.conflicts.length > 1 ? "s" : ""}</strong> —
            about <strong>${esc(formatSqm(result.totalOverlapSqm))}</strong> (${pct(result.totalOverlapSqm, result.searcherSqm)}% of your land).
            Please resolve this before you buy or list.
          </div>
        </td></tr>
      </table>`
    : `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.successBg};border:1px solid #c7e6d6;border-radius:14px;">
        <tr><td style="padding:18px 20px;">
          <div style="font:700 18px/1.3 Arial,Helvetica,sans-serif;color:${BRAND.success};">✓&nbsp; No conflicts found</div>
          <div style="font:400 14px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink};margin-top:6px;">
            Your boundary doesn't overlap any registered plot on RealEstate. Keep this report for your records.
          </div>
        </td></tr>
      </table>`;

  // key figures
  const figures = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0;">
      <tr>
        ${statTile("Your boundary", formatSqm(result.searcherSqm))}
        ${statTile("As acres", formatAcres(result.searcherSqm))}
      </tr>
      <tr>
        ${statTile("Plots overlapping", conflict ? String(result.conflicts.length) : "0", conflict ? BRAND.danger : BRAND.success)}
        ${statTile("Total overlap", conflict ? `${formatSqm(result.totalOverlapSqm)} · ${pct(result.totalOverlapSqm, result.searcherSqm)}%` : "0 m²", conflict ? BRAND.danger : BRAND.success)}
      </tr>
    </table>`;

  // conflicts table
  const conflictRows = result.conflicts
    .map(
      (c, i) => `
      <tr style="background:${i % 2 ? "#fbfcfb" : "#ffffff"};">
        <td style="padding:10px 12px;font:700 13px/1.4 'Courier New',monospace;color:${BRAND.ink};border-bottom:1px solid #eef1ee;">${esc(c.plotNumber)}</td>
        <td style="padding:10px 12px;font:400 13px/1.4 Arial,Helvetica,sans-serif;color:${BRAND.ink};border-bottom:1px solid #eef1ee;">${esc(c.estateName)}<div style="color:${BRAND.muted};font-size:12px;">${esc(c.owner)}</div></td>
        <td align="right" style="padding:10px 12px;font:700 13px/1.4 Arial,Helvetica,sans-serif;color:${BRAND.danger};border-bottom:1px solid #eef1ee;white-space:nowrap;">${esc(formatSqm(c.overlapSqm))}<div style="color:${BRAND.muted};font-weight:400;font-size:12px;">${pct(c.overlapSqm, result.searcherSqm)}% of yours</div></td>
      </tr>`,
    )
    .join("");

  const conflictTable = conflict
    ? `
    <div style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${BRAND.ink};margin:22px 0 8px;">Overlapping plots</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6eae7;border-radius:12px;overflow:hidden;">
      <tr style="background:#f2f5f2;">
        <th align="left" style="padding:9px 12px;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:${BRAND.muted};">Plot</th>
        <th align="left" style="padding:9px 12px;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:${BRAND.muted};">Estate &amp; owner</th>
        <th align="right" style="padding:9px 12px;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:${BRAND.muted};">Overlap</th>
      </tr>
      ${conflictRows}
    </table>`
    : "";

  // guidance
  const steps = conflict
    ? [
        "Do <strong>not</strong> pay for this land before the overlap is resolved.",
        "Ask the seller for the registered indenture and site plan, and confirm the boundary with a licensed surveyor.",
        "Verify the title and any pending disputes at the Lands Commission.",
        "Reply to this email or contact our documents team and we'll help you investigate.",
      ]
    : [
        "This is a strong first check, but always confirm the title at the Lands Commission before you buy.",
        "Keep this report and reference number with your purchase records.",
        "Ready to proceed? You can list or buy this land on RealEstate with escrow protection.",
      ];

  const guidance = `
    <div style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${BRAND.ink};margin:22px 0 8px;">What to do next</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${steps
        .map(
          (s) => `<tr>
            <td width="22" valign="top" style="padding:4px 0;font:700 14px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.gold};">•</td>
            <td style="padding:4px 0;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.ink};">${s}</td>
          </tr>`,
        )
        .join("")}
    </table>`;

  const ctaLabel = conflict ? "Talk to our documents team" : "Open RealEstate";
  const ctaHref = conflict ? `${appUrl}/faq` : appUrl;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BRAND.bg};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">

      <!-- header -->
      <tr><td style="background:${BRAND.green};padding:26px 28px;border-radius:16px 16px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font:700 22px/1 Arial,Helvetica,sans-serif;color:#ffffff;">Real<span style="font-weight:400;">Estate</span></td>
          <td align="right" style="font:600 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.gold};">Land verification</td>
        </tr></table>
        <div style="font:700 20px/1.3 Arial,Helvetica,sans-serif;color:#ffffff;margin-top:16px;">Your land conflict report</div>
        <div style="font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#cdd8d1;margin-top:4px;">Reference ${esc(reference)} · ${esc(formatDateTime(checkedAt.toISOString()))}</div>
      </td></tr>

      <!-- body -->
      <tr><td style="background:${BRAND.card};padding:26px 28px;">
        <div style="font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.ink};margin-bottom:16px;">
          Hi ${esc(firstName)}, here are the results of the land conflict check you ran on RealEstate.
        </div>
        ${verdict}
        <div style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${BRAND.ink};margin:22px 0 4px;">At a glance</div>
        ${figures}
        ${conflictTable}
        ${guidance}
        <div style="text-align:center;margin:26px 0 6px;">
          <a href="${esc(ctaHref)}" style="display:inline-block;background:${BRAND.gold};color:${BRAND.goldInk};font:700 14px/1 Arial,Helvetica,sans-serif;text-decoration:none;padding:14px 26px;border-radius:10px;">${esc(ctaLabel)} →</a>
        </div>
      </td></tr>

      <!-- disclaimer -->
      <tr><td style="background:${BRAND.card};padding:0 28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f6;border-radius:12px;">
          <tr><td style="padding:14px 16px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted};">
            <strong style="color:${BRAND.ink};">Please note:</strong> this check compares your boundary against parcels registered on the RealEstate
            platform only. It is a fraud-screening aid, not a substitute for an official title search at the Lands Commission.
          </td></tr>
        </table>
      </td></tr>

      <!-- footer -->
      <tr><td style="padding:20px 28px 8px;text-align:center;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted};border-radius:0 0 16px 16px;">
        Sent to ${esc(input.recipientEmail)} · RealEstate, 12 Independence Ave, Accra<br/>
        Questions? Reply to this email or write to <a href="mailto:advisors@realestate.app" style="color:${BRAND.greenSoft};">advisors@realestate.app</a>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  // plain-text fallback
  const textLines = [
    `RealEstate — Land conflict report (${reference})`,
    formatDateTime(checkedAt.toISOString()),
    "",
    `Hi ${firstName},`,
    "",
    conflict
      ? `CONFLICT DETECTED: your boundary overlaps ${result.conflicts.length} registered plot(s) — ${formatSqm(result.totalOverlapSqm)} (${pct(result.totalOverlapSqm, result.searcherSqm)}% of your land).`
      : "NO CONFLICTS FOUND: your boundary doesn't overlap any registered plot on RealEstate.",
    "",
    `Your boundary: ${formatSqm(result.searcherSqm)} (${formatSqft(result.searcherSqm)}, ${formatAcres(result.searcherSqm)})`,
    "",
    ...(conflict
      ? [
          "Overlapping plots:",
          ...result.conflicts.map(
            (c) => `  - ${c.plotNumber} · ${c.estateName} · owner ${c.owner} · overlap ${formatSqm(c.overlapSqm)} (${pct(c.overlapSqm, result.searcherSqm)}% of yours)`,
          ),
          "",
        ]
      : []),
    "What to do next:",
    ...steps.map((s) => `  - ${s.replace(/<[^>]+>/g, "")}`),
    "",
    "Note: checks RealEstate-registered parcels only — always confirm title at the Lands Commission.",
  ];

  return { subject, html, text: textLines.join("\n") };
}
