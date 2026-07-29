import type { EscrowStep, PaymentMethod, Purchase, PurchasePlot } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, one, payload } from "./http";
import { pushNotification } from "./notifications";
import { setParcelStatuses } from "./parcels";

function freshEscrow(): EscrowStep[] {
  return [
    { key: "funds-held", label: "Funds held in escrow", description: "Payment received and locked", status: "complete", date: new Date().toISOString() },
    { key: "documents-transfer", label: "Documents transfer", description: "Indenture & site plan being executed", status: "current" },
    { key: "title-handover", label: "Title handover", description: "Registration at the Lands Commission", status: "pending" },
    { key: "released", label: "Funds released", description: "Seller paid out — plot is yours", status: "pending" },
  ];
}

export async function getPurchases(buyerId: string): Promise<Purchase[]> {
  if (LIVE) return many<Purchase>(await http.get("/v1/purchases"));
  await delay();
  return getDb()
    .purchases.filter((p) => p.buyerId === buyerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPurchase(id: string): Promise<Purchase | null> {
  if (LIVE) return one<Purchase>(await http.get(`/v1/purchases/${id}`), "purchase");
  await delay(200);
  return getDb().purchases.find((p) => p.id === id) ?? null;
}

export interface StartPurchaseInput {
  buyerId: string;
  plots: PurchasePlot[];
  paymentMethod: PaymentMethod;
  /** Set by the sandbox payment form to exercise the failure path. */
  simulateFailure?: boolean;
}

/**
 * Live: create the purchase (reserves plots + payment intent), then drive the
 * sandbox payment to success/failure. Mock: simulate the same locally.
 */
export async function startPurchase(input: StartPurchaseInput): Promise<Purchase> {
  if (LIVE) {
    const created = payload<{ purchase: Purchase; paymentClientData?: { reference?: string }; reference?: string }>(
      await http.post("/v1/purchases", {
        plotIds: input.plots.map((p) => p.parcelId),
        paymentMethod: input.paymentMethod,
      }),
    );
    const reference = created.paymentClientData?.reference ?? created.reference;
    const outcome = input.simulateFailure ? "failed" : "success";
    const done = payload<{ purchase?: Purchase }>(
      await http.post("/v1/payments/sandbox/complete", { reference, outcome }),
    );
    if (input.simulateFailure) {
      throw new Error("Payment declined by provider. No funds were taken — please try again.");
    }
    return (done.purchase ?? created.purchase) as Purchase;
  }

  await delay(2400);
  if (input.simulateFailure) {
    throw new Error("Payment declined by provider. No funds were taken — please try again.");
  }
  const amount = input.plots.reduce((sum, p) => sum + p.price, 0);
  const purchase: Purchase = {
    id: uid("pur"),
    receiptNo: `RE-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`,
    buyerId: input.buyerId,
    plots: input.plots,
    totalAreaSqm: input.plots.reduce((sum, p) => sum + p.areaSqm, 0),
    amount,
    fees: Math.round(amount * 0.02),
    paymentMethod: input.paymentMethod,
    status: "in-escrow",
    escrow: freshEscrow(),
    monitored: false,
    documents: [{ name: "Payment receipt.pdf", type: "receipt" }],
    createdAt: new Date().toISOString(),
  };
  mutateDb((db) => db.purchases.unshift(purchase));
  setParcelStatuses(input.plots.map((p) => p.parcelId), "sold");
  pushNotification({
    userId: input.buyerId,
    type: "escrow",
    title: "Funds held in escrow",
    body: `${purchase.receiptNo}: payment for ${purchase.plots.length} plot(s) is locked until documents and title transfer.`,
    href: `/dashboard/purchase/${purchase.id}`,
  });
  return purchase;
}

const STEP_ORDER = ["funds-held", "documents-transfer", "title-handover", "released"] as const;

/** Advance the escrow to its next stage. */
export async function advanceEscrow(purchaseId: string): Promise<Purchase | null> {
  if (LIVE) return one<Purchase>(await http.post(`/v1/purchases/${purchaseId}/escrow/advance`), "purchase");

  await delay(900);
  let result: Purchase | null = null;
  mutateDb((db) => {
    const p = db.purchases.find((x) => x.id === purchaseId);
    if (!p) return;
    const idx = p.escrow.findIndex((s) => s.status === "current");
    if (idx === -1) return;
    p.escrow[idx] = { ...p.escrow[idx], status: "complete", date: new Date().toISOString() };
    if (idx + 1 < p.escrow.length) {
      p.escrow[idx + 1] = { ...p.escrow[idx + 1], status: "current" };
    }
    if (p.escrow.every((s) => s.status === "complete")) {
      p.status = "completed";
      p.documents = [
        ...p.documents,
        ...p.plots.flatMap((plot) => [
          { name: `Registered indenture — ${plot.plotNumber}.pdf`, type: "indenture" },
          { name: `Site plan — ${plot.plotNumber}.pdf`, type: "site-plan" },
          { name: `Title certificate — ${plot.plotNumber}.pdf`, type: "title-certificate" },
        ]),
      ];
    }
    result = { ...p };
    const stepLabel = p.escrow[Math.min(idx + 1, p.escrow.length - 1)].label;
    db.notifications.unshift({
      id: uid("ntf"),
      userId: p.buyerId,
      type: "escrow",
      title: `Escrow update — ${p.receiptNo}`,
      body: p.status === "completed" ? "All steps complete. Congratulations, the land is officially yours!" : `Next stage: ${stepLabel}`,
      href: `/dashboard/purchase/${p.id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
  return result;
}

export async function toggleMonitor(purchaseId: string): Promise<boolean> {
  if (LIVE) {
    const d = payload<{ monitored?: boolean; purchase?: Purchase }>(await http.patch(`/v1/purchases/${purchaseId}/monitor`));
    return d.monitored ?? d.purchase?.monitored ?? false;
  }
  await delay(200);
  let monitored = false;
  mutateDb((db) => {
    const p = db.purchases.find((x) => x.id === purchaseId);
    if (p) {
      p.monitored = !p.monitored;
      monitored = p.monitored;
    }
  });
  return monitored;
}

export const STEP_KEYS = STEP_ORDER;
