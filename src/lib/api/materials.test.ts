import { describe, expect, it } from "vitest";
import { getMaterials, placeMaterialOrder, getMaterialOrders, advanceMaterialOrder } from "./materials";

describe("materials catalog", () => {
  it("returns the full catalog and filters by category", async () => {
    const all = await getMaterials();
    expect(all.length).toBeGreaterThan(40);
    const cement = await getMaterials({ category: "cement" });
    expect(cement.length).toBeGreaterThan(0);
    expect(cement.every((m) => m.category === "cement")).toBe(true);
  });

  it("searches by name/brand and sorts by price", async () => {
    const found = await getMaterials({ q: "cement" });
    expect(found.some((m) => /cement/i.test(m.name) || /cement/i.test(m.brand))).toBe(true);
    const asc = await getMaterials({ sort: "price-asc" });
    const prices = asc.map((m) => m.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe("material orders", () => {
  it("places an order, stores it, and advances fulfilment", async () => {
    const order = await placeMaterialOrder({
      buyerId: "u-buyer-1",
      items: [
        { materialId: "mat-001", qty: 10 },
        { materialId: "mat-005", qty: 200 },
      ],
      paymentMethod: "mtn-momo",
      deliveryAddress: "Plot 14, Oyibi Hillcrest",
      region: "Greater Accra",
    });
    expect(order.status).toBe("confirmed");
    expect(order.lines).toHaveLength(2);
    expect(order.total).toBe(order.subtotal + order.deliveryFee);

    const orders = await getMaterialOrders("u-buyer-1");
    expect(orders.some((o) => o.id === order.id)).toBe(true);

    const advanced = await advanceMaterialOrder(order.id);
    expect(advanced?.status).toBe("dispatched");
  });

  it("fails cleanly when the sandbox failure flag is set", async () => {
    await expect(
      placeMaterialOrder({
        buyerId: "u-buyer-1",
        items: [{ materialId: "mat-001", qty: 1 }],
        paymentMethod: "card",
        deliveryAddress: "x",
        region: "Greater Accra",
        simulateFailure: true,
      }),
    ).rejects.toThrow(/declined/i);
  });
});
