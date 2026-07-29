import { beforeEach, describe, expect, it } from "vitest";
import { useSelection, type SelectedPlot } from "./selection";

const plot = (id: string, areaSqm = 650): SelectedPlot => ({
  id,
  estateId: "oyibi-hillcrest",
  estateName: "Oyibi Hillcrest Gardens",
  plotNumber: id.toUpperCase(),
  owner: "Adom Lands & Estates Ltd",
  status: "available",
  areaSqm,
  lengthM: 30.48,
  breadthM: 21.34,
  price: 85000,
});

describe("selection store", () => {
  beforeEach(() => useSelection.getState().clearSelection());

  it("toggles plots in and out of the selection", () => {
    useSelection.getState().togglePlot(plot("oy-001"));
    useSelection.getState().togglePlot(plot("oy-002"));
    expect(useSelection.getState().selected).toHaveLength(2);

    useSelection.getState().togglePlot(plot("oy-001"));
    expect(useSelection.getState().selected.map((p) => p.id)).toEqual(["oy-002"]);
  });

  it("removes a specific plot", () => {
    useSelection.getState().togglePlot(plot("oy-001"));
    useSelection.getState().togglePlot(plot("oy-002"));
    useSelection.getState().removePlot("oy-002");
    expect(useSelection.getState().selected.map((p) => p.id)).toEqual(["oy-001"]);
  });

  it("supports totals across the selection", () => {
    useSelection.getState().togglePlot(plot("oy-001", 600));
    useSelection.getState().togglePlot(plot("oy-002", 700));
    const total = useSelection.getState().selected.reduce((s, p) => s + p.areaSqm, 0);
    expect(total).toBe(1300);
  });
});
