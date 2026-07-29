"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParcelProperties } from "@/types";

export interface SelectedPlot extends ParcelProperties {
  estateName: string;
  /** Plot centroid — used for “Get directions”. */
  lng?: number;
  lat?: number;
}

interface SelectionState {
  /** Plots the buyer has picked on the map — carried into checkout. */
  selected: SelectedPlot[];
  togglePlot: (plot: SelectedPlot) => void;
  removePlot: (parcelId: string) => void;
  clearSelection: () => void;
}

export const useSelection = create<SelectionState>()(
  persist(
    (set) => ({
      selected: [],
      togglePlot: (plot) =>
        set((s) =>
          s.selected.some((p) => p.id === plot.id)
            ? { selected: s.selected.filter((p) => p.id !== plot.id) }
            : { selected: [...s.selected, plot] },
        ),
      removePlot: (parcelId) =>
        set((s) => ({ selected: s.selected.filter((p) => p.id !== parcelId) })),
      clearSelection: () => set({ selected: [] }),
    }),
    { name: "realestate:selection" },
  ),
);
