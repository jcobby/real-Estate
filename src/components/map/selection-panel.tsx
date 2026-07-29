"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Eye,
  EyeOff,
  Headset,
  MousePointerClick,
  Navigation,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlotStatusBadge } from "@/components/shared/badges";
import { useSelection, type SelectedPlot } from "@/stores/selection";
import { useFavorites } from "@/stores/favorites";
import { useSession } from "@/stores/session";
import { formatAcres, formatGHS, formatNumber, formatSqft, formatSqm } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SelectionPanel({ onFocusPlot }: { onFocusPlot: (plot: SelectedPlot) => void }) {
  const router = useRouter();
  const { session } = useSession();
  const selected = useSelection((s) => s.selected);
  const removePlot = useSelection((s) => s.removePlot);
  const clearSelection = useSelection((s) => s.clearSelection);
  const [expanded, setExpanded] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);

  const totalSqm = selected.reduce((s, p) => s + p.areaSqm, 0);
  const totalPrice = selected.reduce((s, p) => s + p.price, 0);

  const buy = () => {
    if (!session) {
      toast("Sign in to buy land", { description: "Your selection is kept — sign in and continue to checkout." });
      router.push("/login?next=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (selected.length === 0) {
    return (
      <div className="absolute top-3 right-14 z-10 hidden w-72 rounded-2xl bg-background/95 p-4 shadow-xl backdrop-blur-sm lg:right-3 lg:block">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MousePointerClick className="size-4 text-primary" aria-hidden />
          Build your selection
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Tap any <span className="font-semibold text-success">green</span> plot to add it. Select as many as you
          like across estates, then buy them together with escrow protection.
        </p>
      </div>
    );
  }

  return (
    <>
      <section
        aria-label="Selected plots"
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t bg-background shadow-2xl",
          "lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-8 lg:w-96 lg:rounded-2xl lg:border",
          expanded ? "max-h-[70dvh]" : "max-h-none",
          "lg:max-h-none",
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center justify-between gap-2 px-5 py-3.5 text-left lg:cursor-default"
        >
          <div>
            <p className="font-heading text-sm font-bold">
              Your selection <span className="text-primary">({selected.length})</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSqft(totalSqm)} · {formatAcres(totalSqm)} · {formatGHS(totalPrice)}
            </p>
          </div>
          <span className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
                toast("Selection cleared");
              }}
            >
              Clear
            </Button>
            <span className="lg:hidden" aria-hidden>
              {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </span>
          </span>
        </button>

        <Separator />

        <ScrollArea className={cn("flex-1 overflow-y-auto", !expanded && "hidden lg:block")}>
          <ul className="divide-y">
            {selected.map((plot) => (
              <PlotRow key={plot.id} plot={plot} onFocus={() => onFocusPlot(plot)} onRemove={() => removePlot(plot.id)} />
            ))}
          </ul>
        </ScrollArea>

        <div className="border-t bg-muted/40 p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Total selections</dt>
            <dd className="text-right font-semibold">{selected.length} plots</dd>
            <dt className="text-muted-foreground">Total land area</dt>
            <dd className="text-right font-semibold">
              {formatSqft(totalSqm)} ({formatAcres(totalSqm)})
            </dd>
            <dt className="text-muted-foreground">Estimated total</dt>
            <dd className="text-right font-heading text-base font-bold">{formatGHS(totalPrice)}</dd>
          </dl>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" className="h-11" onClick={buy}>
              <ShoppingCart data-icon="inline-start" /> Buy {selected.length} plot{selected.length > 1 ? "s" : ""}
            </Button>
            <Button variant="outline" size="lg" className="h-11" onClick={() => setSupportOpen(true)}>
              <Headset data-icon="inline-start" /> Support
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Talk to us before you buy</DialogTitle>
            <DialogDescription>
              Our land advisors can walk you through the documents, arrange a site visit, or negotiate on your behalf
              — free of charge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="rounded-lg border px-3 py-2">📞 +233 30 255 0000 (Mon–Sat, 8am–6pm)</p>
            <p className="rounded-lg border px-3 py-2">✉️ advisors@realestate.app</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setSupportOpen(false);
                toast.success("Request sent", { description: "An advisor will reach out within one business hour." });
              }}
            >
              Request a callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlotRow({
  plot,
  onFocus,
  onRemove,
}: {
  plot: SelectedPlot;
  onFocus: () => void;
  onRemove: () => void;
}) {
  const monitored = useFavorites((s) => s.monitoredParcels.includes(plot.id));
  const toggleMonitor = useFavorites((s) => s.toggleMonitorParcel);

  const directions = () => {
    if (plot.lat == null || plot.lng == null) {
      toast.error("No coordinates available for this plot");
      return;
    }
    const dest = `${plot.lat},${plot.lng}`;
    const open = (origin?: string) => {
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
      window.open(url, "_blank", "noopener");
    };
    if (!navigator.geolocation) {
      open();
      return;
    }
    toast("Getting your location for directions…");
    navigator.geolocation.getCurrentPosition(
      (pos) => open(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => open(),
      { timeout: 4000 },
    );
  };

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-bold">{plot.plotNumber}</p>
        <PlotStatusBadge status={plot.status} />
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {plot.estateName} · Owner: <span className="font-medium text-foreground">{plot.owner}</span>
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted/60 px-2 py-1.5">
          <dt className="text-[10px] text-muted-foreground uppercase">Area</dt>
          <dd className="font-semibold">{formatSqm(plot.areaSqm)}</dd>
          <dd className="text-[10px] text-muted-foreground">{formatSqft(plot.areaSqm)}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 px-2 py-1.5">
          <dt className="text-[10px] text-muted-foreground uppercase">Length</dt>
          <dd className="font-semibold">{plot.lengthM ? `${formatNumber(plot.lengthM, { maximumFractionDigits: 1 })} m` : "—"}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 px-2 py-1.5">
          <dt className="text-[10px] text-muted-foreground uppercase">Breadth</dt>
          <dd className="font-semibold">{plot.breadthM ? `${formatNumber(plot.breadthM, { maximumFractionDigits: 1 })} m` : "—"}</dd>
        </div>
      </dl>
      <div className="mt-2.5 flex items-center gap-1">
        <p className="mr-auto text-sm font-bold">{formatGHS(plot.price)}</p>
        <Button variant="ghost" size="icon-sm" aria-label={`Locate ${plot.plotNumber} on map`} onClick={onFocus}>
          <Crosshair />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={monitored ? `Stop monitoring ${plot.plotNumber}` : `Monitor ${plot.plotNumber}`}
          aria-pressed={monitored}
          className={cn(monitored && "text-primary")}
          onClick={() => {
            toggleMonitor(plot.id);
            toast(monitored ? "Monitoring off" : "Monitoring on", {
              description: monitored ? undefined : "We'll alert you about status changes and encroachment reports.",
            });
          }}
        >
          {monitored ? <Eye /> : <EyeOff />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Get directions to ${plot.plotNumber}`} onClick={directions}>
          <Navigation />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${plot.plotNumber} from selection`}
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
