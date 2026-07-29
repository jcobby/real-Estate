// Renders docs/SPECIFICATION.md to a print-ready PDF using marked + Playwright Chromium.
// Usage: node scripts/build-spec-pdf.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { marked } from "marked";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mdPath = resolve(root, "docs/SPECIFICATION.md");
const htmlPath = resolve(root, "docs/RealEstate-Specification.html");
const pdfPath = resolve(root, "docs/RealEstate-Specification.pdf");

const md = readFileSync(mdPath, "utf8");
const body = marked.parse(md, { gfm: true, breaks: false });

const css = `
  :root { --ink:#1a2233; --muted:#5b6472; --line:#e2e6ee; --brand:#166a3f; --accent:#b9892f; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 10.5px/1.55 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         color: var(--ink); margin: 0; }
  .page { padding: 0; }
  h1, h2, h3, h4 { color: var(--ink); line-height: 1.25; font-weight: 700; }
  h1 { font-size: 22px; border-bottom: 3px solid var(--brand); padding-bottom: 6px; margin: 26px 0 14px;
       page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { font-size: 15px; color: var(--brand); margin: 22px 0 8px; border-bottom: 1px solid var(--line);
       padding-bottom: 3px; page-break-after: avoid; }
  h3 { font-size: 12.5px; margin: 16px 0 6px; page-break-after: avoid; }
  h4 { font-size: 11px; margin: 12px 0 4px; }
  p { margin: 6px 0; }
  a { color: var(--brand); text-decoration: none; }
  ul, ol { margin: 6px 0 6px 0; padding-left: 20px; }
  li { margin: 2px 0; }
  strong { color: #0f1626; }
  code { font-family: "SF Mono", "Consolas", monospace; font-size: 9.2px; background: #f4f6fa;
         padding: 1px 4px; border-radius: 3px; color: #b0355f; }
  pre { background: #0f1626; color: #e7ecf5; padding: 12px 14px; border-radius: 6px; overflow-x: auto;
        font-family: "SF Mono", "Consolas", monospace; font-size: 8.6px; line-height: 1.45;
        page-break-inside: avoid; }
  pre code { background: transparent; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9px;
          page-break-inside: avoid; }
  th, td { border: 1px solid var(--line); padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #eef4f0; color: #0f1626; font-weight: 700; }
  tr:nth-child(even) td { background: #fafbfd; }
  blockquote { margin: 10px 0; padding: 8px 14px; background: #fbf6ea; border-left: 4px solid var(--accent);
               color: #4a3c1c; border-radius: 0 4px 4px 0; }
  blockquote p { margin: 3px 0; }
  hr { border: none; border-top: 1px solid var(--line); margin: 18px 0; }
  em { color: var(--muted); }
`;

const cover = `
  <div style="page-break-after: always; padding: 120px 10px 0; text-align: center;">
    <div style="font-size: 13px; letter-spacing: 3px; color: #b9892f; font-weight: 700;">SOFTWARE SPECIFICATION</div>
    <div style="font-size: 44px; font-weight: 800; color: #166a3f; margin: 14px 0 4px;">RealEstate</div>
    <div style="font-size: 15px; color: #5b6472;">Ghana land &amp; property marketplace — Frontend &amp; Backend</div>
    <div style="margin: 40px auto 0; width: 70%; border-top: 1px solid #e2e6ee; padding-top: 18px;
                font-size: 11px; color: #5b6472; text-align: left;">
      <p><strong>Purpose:</strong> hand-off document for the backend team. Specifies the existing Next.js
      frontend and the production backend required to support it, integrating through a versioned API contract.</p>
      <p><strong>Version:</strong> 1.0 &nbsp;·&nbsp; <strong>Status:</strong> For implementation</p>
      <p><strong>Repositories:</strong> Frontend (exists) &amp; Backend (to build) — independently deployable.</p>
    </div>
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
  <body><div class="page">${cover}${body}</div></body></html>`;

writeFileSync(htmlPath, html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "16mm", left: "15mm", right: "15mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:7px;color:#9aa3b2;width:100%;padding:0 15mm;text-align:right;">
    RealEstate — Software Specification v1.0</div>`,
  footerTemplate: `<div style="font-size:7px;color:#9aa3b2;width:100%;padding:0 15mm;
    display:flex;justify-content:space-between;">
    <span>Confidential — for backend handover</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();

console.log("Wrote:", pdfPath);
console.log("Wrote:", htmlPath);
