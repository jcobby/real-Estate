"use client";

import { useState } from "react";
import { Check, MapPinned, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderRing, ringAreaSqm } from "@/lib/geo";
import { formatSqm } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Build a plot polygon by typing each corner's latitude/longitude. Corners can
 * be entered in any order — they're arranged into a clean ring on submit.
 * `onPlot` receives a closed [lng, lat] ring, matching the map's draw output.
 */
export function CoordinatePolygonInput({
  onPlot,
  onCancel,
  submitLabel = "Plot on map",
}: {
  onPlot: (ring: number[][]) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [points, setPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  /** Paste "5.826, -0.086" into either box → fills both. */
  const smartFill = (value: string, which: "lat" | "lng") => {
    const pair = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]+\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (pair) {
      setLat(pair[1]);
      setLng(pair[2]);
      return;
    }
    (which === "lat" ? setLat : setLng)(value);
  };

  const addCorner = () => {
    const la = Number(lat);
    const lo = Number(lng);
    if (lat.trim() === "" || !Number.isFinite(la) || la < -90 || la > 90) {
      toast.error("Enter a valid latitude (−90 to 90)");
      return;
    }
    if (lng.trim() === "" || !Number.isFinite(lo) || lo < -180 || lo > 180) {
      toast.error("Enter a valid longitude (−180 to 180)");
      return;
    }
    setPoints((p) => [...p, { lat: la, lng: lo }]);
    setLat("");
    setLng("");
  };

  const ring = orderRing(points.map((p) => [p.lng, p.lat]));
  const area = points.length >= 3 ? ringAreaSqm([...ring, ring[0]]) : null;
  const enough = points.length >= 3;

  const plot = () => {
    if (!enough) {
      toast.error("Add at least 3 corners");
      return;
    }
    onPlot([...ring, ring[0]]);
    setPoints([]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Add each corner of <span className="font-medium text-foreground">one plot</span> — most plots have 4. Order
        doesn&apos;t matter; we tidy them into a clean boundary. Tip: paste{" "}
        <span className="font-mono text-foreground">lat, lng</span> to fill both boxes at once.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="coord-lat">Latitude</Label>
          <Input
            id="coord-lat"
            type="text"
            inputMode="decimal"
            placeholder="5.82650"
            value={lat}
            onChange={(e) => smartFill(e.target.value, "lat")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCorner();
              }
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coord-lng">Longitude</Label>
          <Input
            id="coord-lng"
            type="text"
            inputMode="decimal"
            placeholder="-0.08660"
            value={lng}
            onChange={(e) => smartFill(e.target.value, "lng")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCorner();
              }
            }}
          />
        </div>
        <Button type="button" variant="outline" onClick={addCorner}>
          <Plus data-icon="inline-start" /> Add corner
        </Button>
      </div>

      {points.length > 0 ? (
        <ol className="divide-y rounded-xl border">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex size-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span className="font-mono">
                {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove corner ${i + 1}`}
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => setPoints((pts) => pts.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No corners yet — add your first above.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("mr-auto flex items-center gap-1.5 text-xs", enough ? "font-medium text-success" : "text-muted-foreground")}>
          {enough && <Check className="size-3.5 shrink-0" aria-hidden />}
          {points.length} corner{points.length === 1 ? "" : "s"}
          {enough
            ? area != null
              ? ` · ≈ ${formatSqm(area)} — looks good`
              : " — looks good"
            : ` · add ${Math.max(1, 3 - points.length)} more`}
        </p>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="button" onClick={plot} disabled={!enough}>
          <MapPinned data-icon="inline-start" /> {submitLabel}
        </Button>
      </div>
    </div>
  );
}
