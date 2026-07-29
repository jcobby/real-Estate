"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Check,
  CircleCheck,
  CreditCard,
  Eye,
  Keyboard,
  LoaderCircle,
  LocateFixed,
  Mail,
  MapPinned,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/shared/dropzone";
import { PlotStatusBadge } from "@/components/shared/badges";
import { CoordinatePolygonInput } from "@/components/shared/coordinate-polygon-input";
import { GHANA_PLACES, searchPlaces } from "@/data/ghana-places";
import { ConflictMap } from "./conflict-map";
import { checkLandConflict, getEstates, getParcels, sendConflictReportEmail } from "@/lib/api";
import { parseParcelFile } from "@/lib/geo";
import { useSession } from "@/stores/session";
import { formatNumber, formatSqft, formatSqm } from "@/lib/format";
import type { ConflictResult, ParcelCollection } from "@/types";
import { cn } from "@/lib/utils";

const FEE = 25;
const OYIBI = { lat: 5.8265, lng: -0.0866 };
/** A sample boundary drawn over the Oyibi estate so the demo shows a conflict. */
const EXAMPLE: number[][] = [
  [-0.087, 5.8262],
  [-0.0862, 5.8262],
  [-0.0862, 5.8268],
  [-0.087, 5.8268],
  [-0.087, 5.8262],
];
/**
 * Canned result for "Try an example" — a self-contained demo so first-time and
 * signed-out visitors instantly see a real conflict (no login, no fee, no API).
 */
const EXAMPLE_RESULT: ConflictResult = {
  searcherRing: EXAMPLE,
  searcherSqm: 5880,
  totalOverlapSqm: 1460,
  clear: false,
  conflicts: [
    {
      parcelId: "oyibi-hillcrest-032",
      plotNumber: "OY-032",
      owner: "Adom Lands & Estates Ltd",
      estateId: "oyibi-hillcrest",
      estateName: "Oyibi Hillcrest Gardens",
      status: "available",
      overlapSqm: 1460,
      overlapRings: [
        [
          [-0.087, 5.8263],
          [-0.0867, 5.8263],
          [-0.0867, 5.8267],
          [-0.087, 5.8267],
          [-0.087, 5.8263],
        ],
      ],
    },
  ],
};

export function ConflictChecker() {
  const { session } = useSession();
  const searchParams = useSearchParams();
  const [boundary, setBoundary] = useState<number[][] | null>(null);
  const [result, setResult] = useState<ConflictResult | null>(null);
  const [showCoords, setShowCoords] = useState(false);
  const [running, setRunning] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const focusNonce = useRef(0);
  const [focus, setFocus] = useState(0);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const flyRef = useRef(0);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number; nonce: number } | null>(null);

  const flyTo = (lat: number, lng: number, zoom = 16.5) => {
    flyRef.current += 1;
    setFlyTarget({ lat, lng, zoom, nonce: flyRef.current });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser can't share your location");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        flyTo(pos.coords.latitude, pos.coords.longitude, 17);
        toast.success("Jumped to your location", { description: "Now draw or enter your boundary." });
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location", { description: "Allow location access or search your town." });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const { data: allParcels } = useQuery({
    queryKey: ["all-parcels"],
    queryFn: async () => {
      const estates = await getEstates();
      const collections = await Promise.all(estates.map((e) => getParcels(e.id)));
      return { type: "FeatureCollection", features: collections.flatMap((c) => c?.features ?? []) } as ParcelCollection;
    },
  });

  const setLand = (ring: number[][]) => {
    setBoundary(ring);
    setResult(null);
    focusNonce.current += 1;
    setFocus(focusNonce.current);
  };

  const execute = async (ring: number[][]) => {
    setRunning(true);
    try {
      setResult(await checkLandConflict(ring));
    } finally {
      setRunning(false);
    }
  };

  const run = () => {
    if (!boundary) {
      toast.error("Add your land first", { description: "Enter coordinates, upload a GeoJSON/KML file, or try the example." });
      return;
    }
    if (!session && !paid) {
      setPayOpen(true);
      return;
    }
    execute(boundary);
  };

  /** One-tap demo: drop a sample boundary over Oyibi and show a canned conflict
   *  result immediately — free, no login, so first-time users just "get it". */
  const runExample = () => {
    setBoundary(EXAMPLE);
    setResult(EXAMPLE_RESULT);
    focusNonce.current += 1;
    setFocus(focusNonce.current);
    flyTo(OYIBI.lat, OYIBI.lng, 16.5);
  };

  // Auto-run the example when arriving from the homepage's "See a live example".
  useEffect(() => {
    if (!searchParams.get("example")) return;
    const id = setTimeout(runExample, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = (overlap: number) => (result?.searcherSqm ? Math.round((overlap / result.searcherSqm) * 100) : 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card className="gap-3 rounded-2xl p-4">
          <p className="text-sm font-semibold">1. Define your land</p>
          <p className="-mt-1 text-xs text-muted-foreground">
            Enter your boundary coordinates or upload a GeoJSON / KML file — land needs metre precision.
          </p>

          {/* find-your-area: town search + locate-me */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Label htmlFor="cc-place" className="sr-only">
                Search a town
              </Label>
              <Input
                id="cc-place"
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  setPlaceOpen(true);
                }}
                onFocus={() => setPlaceOpen(true)}
                onBlur={() => setTimeout(() => setPlaceOpen(false), 150)}
                placeholder="Search a town — Kumasi, Tamale, Aburi…"
                className="h-10 pl-9"
                autoComplete="off"
              />
              {placeOpen && (
                <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg">
                  {(placeQuery.trim() ? searchPlaces(placeQuery) : GHANA_PLACES.filter((p) => p.major)).map((p) => (
                    <li key={`${p.name}-${p.region}`}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          flyTo(p.lat, p.lng, 15.5);
                          setPlaceQuery(p.name);
                          setPlaceOpen(false);
                        }}
                      >
                        <MapPinned className="size-4 shrink-0 text-primary" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.region} Region</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button type="button" variant="outline" className="h-10 shrink-0" onClick={useMyLocation} disabled={locating}>
              {locating ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <LocateFixed data-icon="inline-start" />}
              Use my location
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={showCoords ? "secondary" : "default"} size="sm" onClick={() => setShowCoords((v) => !v)}>
              <Keyboard data-icon="inline-start" /> Enter coordinates
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={runExample}>
              <Sparkles data-icon="inline-start" /> Try an example
            </Button>
            <div className="w-full sm:w-auto sm:flex-1">
              <Dropzone
                label="…or upload a GeoJSON / KML boundary"
                accept=".geojson,.json,.kml,.kmz"
                multiple={false}
                className="px-4 py-4"
                onFiles={async (files) => {
                  try {
                    const fc = await parseParcelFile(files[0], { estateId: "check", fallbackPrice: 0, fallbackOwner: "You" });
                    const ring = fc.features[0]?.geometry.coordinates[0];
                    if (!ring) throw new Error("No polygon found in that file.");
                    setLand(ring);
                    toast.success(`Loaded boundary from ${files[0].name}`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Couldn't read that file");
                  }
                }}
              />
            </div>
          </div>

          {showCoords && (
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Type each corner of your land — the map plots the boundary when you have at least 3.
              </p>
              <CoordinatePolygonInput
                submitLabel="Plot boundary"
                onCancel={() => setShowCoords(false)}
                onPlot={(ring) => {
                  setLand(ring);
                  setShowCoords(false);
                  toast.success("Boundary plotted from coordinates");
                }}
              />
            </div>
          )}
          {boundary && (
            <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <MapPinned className="size-3.5 shrink-0 text-primary" aria-hidden />
              Boundary set{result ? "" : " — run the check on the right"}.
            </p>
          )}
        </Card>

        <ConflictMap
          center={OYIBI}
          allParcels={allParcels}
          boundary={boundary}
          result={result}
          focusNonce={focus}
          flyTarget={flyTarget}
        />
      </div>

      {/* results / action rail */}
      <aside className="space-y-4">
        <Card className="gap-3 rounded-2xl p-5">
          <p className="text-sm font-semibold">2. Run the conflict check</p>
          <p className="text-xs text-muted-foreground">
            We compare your boundary against every registered plot and highlight any overlap.
          </p>
          <Button size="lg" className="h-11 w-full" onClick={run} disabled={running || !boundary}>
            {running ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ShieldAlert data-icon="inline-start" />}
            {running ? "Checking…" : "Check for conflicts"}
          </Button>
          {session ? (
            <p className="flex items-center gap-1.5 text-[11px] text-success">
              <BadgeCheck className="size-3.5" aria-hidden /> Free on your account
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {paid ? "Payment received — run as many checks as you like." : `A one-off ₵${FEE} fee applies for guests. `}
              {!paid && (
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in to check free
                </Link>
              )}
            </p>
          )}
        </Card>

        {running && <Skeleton className="h-40 rounded-2xl" />}

        {result && !running && (
          result.clear ? (
            <Card className="gap-2 rounded-2xl border-success/40 p-5">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-success/15">
                  <CircleCheck className="size-5 text-success" aria-hidden />
                </span>
                <p className="font-heading text-base font-bold">No conflicts found</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your boundary ({formatSqm(result.searcherSqm)} · {formatSqft(result.searcherSqm)}) doesn&apos;t overlap
                any registered plot on RealEstate.
              </p>
              <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                This checks our platform&apos;s registered parcels only — always confirm title at the Lands Commission too.
              </p>
            </Card>
          ) : (
            <Card className="gap-3 rounded-2xl border-destructive/40 p-5">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-destructive/15">
                  <TriangleAlert className="size-5 text-destructive" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-base font-bold text-destructive">Conflict detected</p>
                  <p className="text-xs text-muted-foreground">
                    Overlaps {result.conflicts.length} registered plot{result.conflicts.length > 1 ? "s" : ""} ·{" "}
                    {formatSqm(result.totalOverlapSqm)} ({pct(result.totalOverlapSqm)}% of your land)
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {result.conflicts.map((c) => (
                  <li key={c.parcelId} className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold">{c.plotNumber}</span>
                      <PlotStatusBadge status={c.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.estateName} · owner: <span className="font-medium text-foreground">{c.owner}</span>
                    </p>
                    <p className="mt-1 text-xs">
                      Overlap: <span className="font-semibold text-destructive">{formatSqm(c.overlapSqm)}</span>{" "}
                      <span className="text-muted-foreground">({formatNumber(pct(c.overlapSqm))}% of yours)</span>
                    </p>
                  </li>
                ))}
              </ul>

              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Part of your boundary is already registered to someone else. Don&apos;t pay for this land before
                resolving the overlap with the seller and the Lands Commission.
              </p>
              <Button variant="outline" className="w-full" render={<Link href="/faq" />}>
                Talk to our documents team
              </Button>
            </Card>
          )
        )}

        {result && !running && (
          <EmailReportCard
            result={result}
            defaultEmail={session?.user.email ?? ""}
            name={session?.user.name ?? "there"}
            userId={session?.user.id}
          />
        )}

        {!result && !running && (
          <Card className="gap-2 rounded-2xl border-dashed p-5 text-center">
            <ShieldAlert className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Results appear here</p>
            <p className="text-xs text-muted-foreground">
              Define your land and run the check to see any overlap with registered plots.
            </p>
          </Card>
        )}
      </aside>

      <PayDialog open={payOpen} onOpenChange={setPayOpen} fee={FEE} onPaid={() => { setPaid(true); setPayOpen(false); if (boundary) execute(boundary); }} phone={session?.user.phone} />
    </div>
  );
}

/** Opens a generated HTML email in a new tab so the user can see the real report. */
function openEmailPreview(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function EmailReportCard({
  result,
  defaultEmail,
  name,
  userId,
}: {
  result: ConflictResult;
  defaultEmail: string;
  name: string;
  userId?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ html: string; reference: string } | null>(null);

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const res = await sendConflictReportEmail({ result, email, name, userId });
      setSent({ html: res.html, reference: res.reference });
      toast.success(`Report emailed to ${email}`, {
        description: `Reference ${res.reference}.`,
        action: { label: "View email", onClick: () => openEmailPreview(res.html) },
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="gap-3 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Mail className="size-4.5 text-primary" aria-hidden />
        <p className="font-heading text-base font-semibold">Email me this report</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Get a clean, detailed copy — the verdict, your boundary, every overlapping plot and what to do next. Keep it or
        share it with your surveyor.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="report-email">Send to</Label>
        <Input
          id="report-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={send} disabled={sending}>
          {sending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
          {sent ? "Resend report" : "Send report"}
        </Button>
        {sent && (
          <Button variant="outline" onClick={() => openEmailPreview(sent.html)}>
            <Eye data-icon="inline-start" /> Preview
          </Button>
        )}
      </div>
      {sent && (
        <p className="flex items-start gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Sent to your email · reference {sent.reference}. Press <span className="font-semibold">Preview</span> to view it.
        </p>
      )}
    </Card>
  );
}

function PayDialog({
  open,
  onOpenChange,
  fee,
  onPaid,
  phone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fee: number;
  onPaid: () => void;
  phone?: string;
}) {
  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [value, setValue] = useState(phone ?? "");
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    if (method === "momo" && !/^\+?[\d\s]{9,15}$/.test(value)) {
      toast.error("Enter a valid mobile-money number");
      return;
    }
    if (method === "card" && value.replace(/\s/g, "").length < 12) {
      toast.error("Enter a valid card number");
      return;
    }
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1500));
    setPaying(false);
    toast.success("Payment received", { description: "Running your conflict check…" });
    onPaid();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay ₵{fee} to run a land check</DialogTitle>
          <DialogDescription>Guests pay a one-off fee per search.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["momo", "MTN MoMo", Smartphone],
            ["card", "Card", CreditCard],
          ] as const).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors",
                method === m ? "border-primary bg-accent" : "hover:bg-muted",
              )}
            >
              <Icon className={cn("size-4", method === m ? "text-primary" : "text-muted-foreground")} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pay-input">{method === "momo" ? "Mobile-money number" : "Card number"}</Label>
          <Input
            id="pay-input"
            value={value}
            inputMode={method === "card" ? "numeric" : "tel"}
            placeholder={method === "momo" ? "+233 24 000 0000" : "4242 4242 4242 4242"}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={pay} disabled={paying}>
            {paying && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
            {paying ? "Processing…" : `Pay ₵${fee} & run`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
