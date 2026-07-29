import { beforeEach, describe, expect, it } from "vitest";
import { useCart } from "./cart";

describe("cart store", () => {
  beforeEach(() => useCart.getState().clear());

  it("adds items and accumulates quantity", () => {
    useCart.getState().add("mat-001");
    useCart.getState().add("mat-001", 2);
    expect(useCart.getState().qtyOf("mat-001")).toBe(3);
    expect(useCart.getState().count()).toBe(3);
  });

  it("tracks distinct items and a running count", () => {
    useCart.getState().add("mat-001");
    useCart.getState().add("mat-002", 4);
    expect(useCart.getState().items).toHaveLength(2);
    expect(useCart.getState().count()).toBe(5);
  });

  it("removes an item when its quantity drops to zero", () => {
    useCart.getState().add("mat-001", 2);
    useCart.getState().setQty("mat-001", 0);
    expect(useCart.getState().qtyOf("mat-001")).toBe(0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("removes an item explicitly", () => {
    useCart.getState().add("mat-001");
    useCart.getState().add("mat-002");
    useCart.getState().remove("mat-001");
    expect(useCart.getState().items.map((i) => i.materialId)).toEqual(["mat-002"]);
  });
});
