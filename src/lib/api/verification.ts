import type { ListingDocument, VerificationCase, VerificationCaseStatus } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, one } from "./http";
import { pushNotification } from "./notifications";

export async function getVerificationCases(status?: VerificationCaseStatus | "all"): Promise<VerificationCase[]> {
  if (LIVE) return many<VerificationCase>(await http.get("/v1/verification-cases", { status }));
  await delay();
  let cases = getDb().verificationCases;
  if (status && status !== "all") cases = cases.filter((c) => c.status === status);
  return [...cases].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getVerificationCase(id: string): Promise<VerificationCase | null> {
  if (LIVE) return one<VerificationCase>(await http.get(`/v1/verification-cases/${id}`), "case");
  await delay(200);
  return getDb().verificationCases.find((c) => c.id === id) ?? null;
}

export async function getSellerVerificationCases(sellerId: string): Promise<VerificationCase[]> {
  if (LIVE) return many<VerificationCase>(await http.get("/v1/verification-cases/mine"));
  await delay();
  return getDb()
    .verificationCases.filter((c) => c.sellerId === sellerId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export interface SubmitVerificationInput {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  documents: Array<Pick<ListingDocument, "name" | "type" | "sizeKb"> & { storageKey?: string }>;
}

export async function submitVerification(input: SubmitVerificationInput): Promise<VerificationCase> {
  if (LIVE) {
    return (one<VerificationCase>(
      await http.post("/v1/verification-cases", { listingId: input.listingId, documents: input.documents }),
      "case",
    )) as VerificationCase;
  }

  await delay(800);
  const now = new Date().toISOString();
  const vc: VerificationCase = {
    id: uid("vc"),
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    status: "submitted",
    documents: input.documents.map((d, i) => ({
      ...d,
      id: uid(`doc${i}`),
      uploadedAt: now,
      verified: false,
    })),
    timeline: [{ status: "submitted", date: now, note: "Documents uploaded by seller" }],
    checks: [
      { label: "Indenture matches Lands Commission records", passed: null },
      { label: "Site plan signed by a licensed surveyor", passed: null },
      { label: "No pending litigation on the parcel", passed: null },
      { label: "Seller identity verified", passed: null },
    ],
    submittedAt: now,
  };
  mutateDb((db) => {
    db.verificationCases.unshift(vc);
    const l = db.listings.find((x) => x.id === input.listingId);
    if (l) l.verification = "pending";
  });
  pushNotification({
    userId: "u-admin-1",
    type: "verification",
    title: "New verification submission",
    body: `${input.listingTitle} — submitted by ${input.sellerName}`,
    href: "/admin/verification",
  });
  return vc;
}

export type ReviewAction = "start-review" | "request-docs" | "approve" | "reject";

/** Admin queue actions — drives the state machine and the listing badge. */
export async function reviewVerificationCase(
  caseId: string,
  action: ReviewAction,
  note?: string,
): Promise<VerificationCase | null> {
  if (LIVE) return one<VerificationCase>(await http.post(`/v1/verification-cases/${caseId}/actions`, { action, note }), "case");

  await delay(600);
  let result: VerificationCase | null = null;
  const statusMap: Record<ReviewAction, VerificationCaseStatus> = {
    "start-review": "under-review",
    "request-docs": "docs-requested",
    approve: "verified",
    reject: "rejected",
  };
  mutateDb((db) => {
    const vc = db.verificationCases.find((c) => c.id === caseId);
    if (!vc) return;
    const next = statusMap[action];
    vc.status = next;
    vc.timeline.push({ status: next, date: new Date().toISOString(), note });
    if (note) vc.adminNote = note;
    if (action === "approve") {
      vc.checks = vc.checks.map((c) => ({ ...c, passed: c.passed ?? true }));
      vc.documents = vc.documents.map((d) => ({ ...d, verified: true }));
    }
    const listing = db.listings.find((l) => l.id === vc.listingId);
    if (listing) {
      listing.verification = action === "approve" ? "verified" : action === "reject" ? "unverified" : "pending";
      if (action === "approve") {
        listing.documents = listing.documents.map((d) => ({ ...d, verified: true }));
        if (listing.status === "pending-review") listing.status = "active";
      }
    }
    result = { ...vc };
    db.notifications.unshift({
      id: uid("ntf"),
      userId: vc.sellerId,
      type: "verification",
      title:
        action === "approve"
          ? "Your listing is now Verified ✓"
          : action === "reject"
            ? "Verification rejected"
            : action === "request-docs"
              ? "More documents requested"
              : "Verification under review",
      body: `${vc.listingTitle}${note ? ` — ${note}` : ""}`,
      href: "/seller/verification",
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
  return result;
}
