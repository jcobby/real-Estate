/** Sandbox document download — generates a small placeholder file client-side. */
export function downloadMockDocument(name: string, context: Record<string, string> = {}) {
  const lines = [
    "REALESTATE — SIMULATED DOCUMENT",
    "================================",
    "",
    `Document: ${name}`,
    `Generated: ${new Date().toLocaleString("en-GH")}`,
    ...Object.entries(context).map(([k, v]) => `${k}: ${v}`),
    "",
    "This file was produced by the RealEstate demo sandbox.",
    "In production this would be the real, signed PDF held in escrow.",
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
