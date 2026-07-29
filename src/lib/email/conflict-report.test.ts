import { describe, expect, it } from "vitest";
import { buildConflictReportEmail } from "./conflict-report";
import type { ConflictResult } from "@/types";

const conflictResult: ConflictResult = {
  searcherRing: [[-0.087, 5.826], [-0.086, 5.826], [-0.086, 5.827], [-0.087, 5.827], [-0.087, 5.826]],
  searcherSqm: 5900,
  totalOverlapSqm: 5200,
  clear: false,
  conflicts: [
    { parcelId: "oyibi-hillcrest-032", plotNumber: "OY-032", owner: "Adom Lands & Estates Ltd", estateId: "oyibi-hillcrest", estateName: "Oyibi Hillcrest Gardens", status: "available", overlapSqm: 709, overlapRings: [[]] },
    { parcelId: "oyibi-hillcrest-041", plotNumber: "OY-041", owner: "Ama <Serwaa>", estateId: "oyibi-hillcrest", estateName: "Oyibi Hillcrest Gardens", status: "sold", overlapSqm: 659, overlapRings: [[]] },
  ],
};

const clearResult: ConflictResult = {
  searcherRing: [[-2, 4], [-1.999, 4], [-1.999, 4.001], [-2, 4.001], [-2, 4]],
  searcherSqm: 1200,
  totalOverlapSqm: 0,
  clear: true,
  conflicts: [],
};

describe("buildConflictReportEmail", () => {
  it("builds a conflict email with verdict, plots and details", () => {
    const email = buildConflictReportEmail({ result: conflictResult, recipientName: "Selorm Agbeko", recipientEmail: "selorm@example.com", reference: "LC-TEST" });
    expect(email.subject).toMatch(/Conflict found/i);
    expect(email.subject).toContain("LC-TEST");
    expect(email.html).toContain("Conflict detected");
    expect(email.html).toContain("OY-032");
    expect(email.html).toContain("Oyibi Hillcrest Gardens");
    expect(email.html).toContain("Hi Selorm,"); // personalised
    expect(email.html).toContain("selorm@example.com"); // footer recipient
    expect(email.text).toContain("CONFLICT DETECTED");
  });

  it("escapes HTML in owner names to avoid injection", () => {
    const email = buildConflictReportEmail({ result: conflictResult, recipientName: "Selorm", recipientEmail: "s@e.com" });
    expect(email.html).toContain("Ama &lt;Serwaa&gt;");
    expect(email.html).not.toContain("Ama <Serwaa>");
  });

  it("builds a clear email with the no-conflict verdict and no table", () => {
    const email = buildConflictReportEmail({ result: clearResult, recipientName: "Kwame Mensah", recipientEmail: "kwame@example.com" });
    expect(email.subject).toMatch(/No conflicts found/i);
    expect(email.html).toContain("No conflicts found");
    expect(email.html).not.toContain("Overlapping plots");
    expect(email.text).toContain("NO CONFLICTS FOUND");
  });
});
