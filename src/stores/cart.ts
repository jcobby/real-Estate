"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  add: (materialId: string, qty?: number) => void;
  setQty: (materialId: string, qty: number) => void;
  remove: (materialId: string) => void;
  clear: () => void;
  qtyOf: (materialId: string) => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (materialId, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.materialId === materialId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.materialId === materialId ? { ...i, qty: Math.min(999, i.qty + qty) } : i,
              ),
            };
          }
          return { items: [...s.items, { materialId, qty }] };
        }),
      setQty: (materialId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.materialId !== materialId)
              : s.items.map((i) => (i.materialId === materialId ? { ...i, qty: Math.min(999, qty) } : i)),
        })),
      remove: (materialId) => set((s) => ({ items: s.items.filter((i) => i.materialId !== materialId) })),
      clear: () => set({ items: [] }),
      qtyOf: (materialId) => get().items.find((i) => i.materialId === materialId)?.qty ?? 0,
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
    }),
    { name: "realestate:cart" },
  ),
);
