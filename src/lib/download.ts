/** Generates a small plain-text copy of a document/receipt client-side. */
export function downloadMockDocument(name: string, context: Record<string, string> = {}) {
  const lines = [
    "REALESTATE — DOCUMENT COPY",
    "================================",
    "",
    `Document: ${name}`,
    `Generated: ${new Date().toLocaleString("en-GH")}`,
    ...Object.entries(context).map(([k, v]) => `${k}: ${v}`),
    "",
    "This is a plain-text copy for your records.",
    "Your official signed PDF is available from your purchase record once documents are finalised.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/\.pdf$/i, ".txt");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
