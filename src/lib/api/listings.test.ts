import { describe, expect, it } from "vitest";
import { getListing, getListings } from "./listings";
import { startPurchase } from "./purchases";
import { getParcels } from "./parcels";

describe("getListings (mock service)", () => {
  it("returns paged active listings", async () => {
    const page = await getListings();
    expect(page.total).toBeGreaterThanOrEqual(40);
    expect(page.items.length).toBeLessThanOrEqual(page.pageSize);
    expect(page.items.every((l) => l.status === "active")).toBe(true);
  });

  it("filters by region and price", async () => {
    const page = await getListings({ region: "Ashanti", maxPrice: 60000 });
    expect(page.items.every((l) => l.region === "Ashanti" && l.price <= 60000)).toBe(true);
  });

  it("sorts by price ascending", async () => {
    const { items } = await getListings({ sort: "price-asc" });
    const prices = items.map((l) => l.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("finds the flagship estate listing", async () => {
    const listing = await getListing("lst-001");
    expect(listing?.estateId).toBe("oyibi-hillcrest");
    expect(listing?.verification).toBe("verified");
  });
});

describe("startPurchase (escrow simulation)", () => {
  it("creates an in-escrow purchase and marks parcels sold", async () => {
    const purchase = await startPurchase({
      buyerId: "u-buyer-1",
      paymentMethod: "mtn-momo",
      plots: [
        {
          parcelId: "oyibi-hillcrest-001",
          plotNumber: "OY-001",
          estateId: "oyibi-hillcrest",
          estateName: "Oyibi Hillcrest Gardens",
          areaSqm: 650,
          price: 85000,
        },
      ],
    });
    expect(purchase.status).toBe("in-escrow");
    expect(purchase.escrow[0].status).toBe("complete");
    expect(purchase.fees).toBe(Math.round(85000 * 0.02));

    const parcels = await getParcels("oyibi-hillcrest");
    const bought = parcels?.features.find((f) => f.properties.id === "oyibi-hillcrest-001");
    expect(bought?.properties.status).toBe("sold");
  });

  it("fails cleanly when the sandbox failure flag is set", async () => {
    await expect(
      startPurchase({ buyerId: "u-buyer-1", paymentMethod: "card", plots: [], simulateFailure: true }),
    ).rejects.toThrow(/declined/i);
  });
});
