"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Check,
  CircleCheck,
  CreditCard,
  Eye,
  Keyboard,
  LandPlot,
  LoaderCircle,
  LocateFixed,
  Mail,
  MapPinned,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
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
import { checkLandConflict, getEstates, getParcels, payForGuestCheck, sendConflictReportEmail } from "@/lib/api";
import { ApiError, describeError } from "@/lib/api/http";
import { convexHull, parseParcelFile, ringAreaSqm } from "@/lib/geo";
import { useSession } from "@/stores/session";
import { formatAcres, formatNumber, formatSqft, formatSqm } from "@/lib/format";
import type { ConflictResult, ParcelCollection, ParcelConflict } from "@/types";
import { cn } from "@/lib/utils";

const FEE = 25;
const OYIBI = { lat: 5.8265, lng: -0.0866 };
/** Large uploads (or a guest's single paid check) run as one combined footprint. */
const MAX_EXACT_BOUNDARIES = 12;

/** Count a ring's distinct corners (ignoring the closing repeat of the first point). */
const ringCorners = (r: number[][]) =>
  r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.length - 1 : r.length;

const closeRing = (r: number[][]) =>
  r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r : [...r, r[0]];

/** Fold several single-boundary checks into one result (dedupe overlapping plots by id). */
function mergeConflictResults(results: ConflictResult[], rings: number[][][]): ConflictResult {
  const byParcel = new Map<string, ParcelConflict>();
  for (const res of results) {
    for (const c of res.conflicts) {
      const ex = byParcel.get(c.parcelId);
      if (ex) {
        ex.overlapSqm = +(ex.overlapSqm + c.overlapSqm).toFixed(1);
        ex.overlapRings = [...ex.overlapRings, ...c.overlapRings];
      } else {
        byParcel.set(c.parcelId, { ...c, overlapRings: [...c.overlapRings] });
      }
    }
  }
  const conflicts = [...byParcel.values()].sort((a, b) => b.overlapSqm - a.overlapSqm);
  return {
    searcherRing: closeRing(rings[0] ?? []),
    searcherSqm: +rings.reduce((s, r) => s + ringAreaSqm(r), 0).toFixed(1),
    conflicts,
    totalOverlapSqm: +conflicts.reduce((s, c) => s + c.overlapSqm, 0).toFixed(1),
    clear: conflicts.length === 0,
  };
}

export function ConflictChecker() {
  const { session } = useSession();
  const [rings, setRings] = useState<number[][][]>([]);
  const [result, setResult] = useState<ConflictResult | null>(null);
  const [showCoords, setShowCoords] = useState(false);
  const [running, setRunning] = useState(false);
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
        toast.success("Jumped to your location", { description: "Now enter your boundary coordinates or upload a file." });
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
      // one estate's parcels failing must not sink the whole check — skip it
      const collections = await Promise.allSettled(estates.map((e) => getParcels(e.id)));
      const features = collections.flatMap((r) => (r.status === "fulfilled" ? (r.value?.features ?? []) : []));
      return { type: "FeatureCollection", features } as ParcelCollection;
    },
  });

  const bumpFocus = () => {
    focusNonce.current += 1;
    setFocus(focusNonce.current);
  };

  /** Replace every boundary — an uploaded file defines the whole set at once. */
  const setLand = (next: number[][][]) => {
    setRings(next);
    setResult(null);
    bumpFocus();
  };
  /** Add one more boundary — typed coordinates or a shape traced on the map. */
  const addRing = (ring: number[][]) => {
    setRings((prev) => [...prev, ring]);
    setResult(null);
    bumpFocus();
  };
  const clearLand = () => {
    setRings([]);
    setResult(null);
  };

  const execute = async (checkToken?: string) => {
    if (rings.length === 0) return;
    setRunning(true);
    try {
      // A handful of boundaries are checked exactly (in parallel) and merged.
      // A big multi-plot file — or a guest's single paid check — is checked as
      // one combined footprint (the convex hull of every polygon), so we never
      // fire hundreds of requests for a 1,000-plot survey.
      const useFootprint = rings.length > 1 && (!!checkToken || rings.length > MAX_EXACT_BOUNDARIES);
      const toCheck = useFootprint ? [convexHull(rings.flat())] : rings;
      const results = await Promise.all(toCheck.map((r) => checkLandConflict(r, checkToken)));
      setResult(mergeConflictResults(results, toCheck));
      if (useFootprint) {
        toast("Checked as one combined boundary", {
          description: `Your ${rings.length.toLocaleString()} plots were checked as a single outer footprint.`,
        });
      }
    } catch (err) {
      // A guest — or a member whose session lapsed — needs to pay for this check.
      if (err instanceof ApiError && err.code === "PAYMENT_REQUIRED") {
        setPayOpen(true);
      } else {
        toast.error("Couldn't run the check", { description: describeError(err) });
      }
    } finally {
      setRunning(false);
    }
  };

  const run = () => {
    if (rings.length === 0) {
      toast.error("Add your land first", { description: "Enter your boundary coordinates or upload a GeoJSON/KML file." });
      return;
    }
    if (!session) {
      setPayOpen(true); // guests pay a one-off fee for each check
      return;
    }
    execute();
  };

  /** Live totals across every plotted boundary, shown once land is on the map. */
  const landSqm = rings.reduce((s, r) => s + ringAreaSqm(r), 0);
  const cornerCount = rings.reduce((s, r) => s + ringCorners(r), 0);

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

          {/* two equally-sized, equally-prominent ways to define the boundary */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-expanded={showCoords}
              onClick={() => setShowCoords((v) => !v)}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 px-4 py-8 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring",
                showCoords
                  ? "border-primary bg-accent"
                  : "border-primary/60 bg-primary/5 hover:border-primary hover:bg-primary/10",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Keyboard className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold">Enter coordinates</span>
              <span className="text-xs text-muted-foreground">Type each corner of your land</span>
            </button>
            <Dropzone
              label="Upload GeoJSON / KML"
              hint="Drag a surveyor file, or click to browse"
              accept=".geojson,.json,.kml,.kmz"
              multiple={false}
              className="px-4 py-8"
              onFiles={async (files) => {
                try {
                  const fc = await parseParcelFile(files[0], { estateId: "check", fallbackPrice: 0, fallbackOwner: "You" });
                  const newRings = fc.features.map((f) => f.geometry.coordinates[0]).filter((r) => Array.isArray(r) && r.length >= 3);
                  if (newRings.length === 0) throw new Error("No polygon found in that file.");
                  setLand(newRings);
                  toast.success(
                    newRings.length > 1
                      ? `Loaded ${newRings.length} boundaries from ${files[0].name}`
                      : `Loaded boundary from ${files[0].name}`,
                  );
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Couldn't read that file");
                }
              }}
            />
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
                  addRing(ring);
                  setShowCoords(false);
                  toast.success("Boundary plotted from coordinates");
                }}
              />
            </div>
          )}
          {rings.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <MapPinned className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="flex-1">
                {rings.length} boundar{rings.length > 1 ? "ies" : "y"} set{result ? "" : " — run the check on the right"}.
              </span>
              <Button type="button" variant="ghost" size="xs" onClick={clearLand}>
                <RotateCcw data-icon="inline-start" /> Start over
              </Button>
            </div>
          )}
        </Card>

        <ConflictMap
          center={OYIBI}
          allParcels={allParcels}
          boundaries={rings}
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
          <Button size="lg" className="h-11 w-full" onClick={run} disabled={running || rings.length === 0}>
            {running ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ShieldAlert data-icon="inline-start" />}
            {running ? "Checking…" : "Check for conflicts"}
          </Button>
          {session ? (
            <p className="flex items-center gap-1.5 text-[11px] text-success">
              <BadgeCheck className="size-3.5" aria-hidden /> Free on your account
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {`A one-off ₵${FEE} fee applies per check for guests. `}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in to check free
              </Link>
            </p>
          )}
        </Card>

        {/* measured properties of the plotted land — appears as soon as it's on the map */}
        {rings.length > 0 && (
          <Card className="gap-3 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <LandPlot className="size-4.5 text-primary" aria-hidden />
              <p className="font-heading text-base font-semibold">Your land</p>
              {rings.length > 1 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {rings.length} boundaries
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Total area</dt>
                <dd className="mt-0.5 font-heading text-lg font-bold">{formatAcres(landSqm)}</dd>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Size</dt>
                <dd className="mt-0.5 font-heading text-lg font-bold">{formatSqm(landSqm)}</dd>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">In feet</dt>
                <dd className="mt-0.5 text-sm font-semibold">{formatSqft(landSqm)}</dd>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Corners</dt>
                <dd className="mt-0.5 text-sm font-semibold">
                  {cornerCount} point{cornerCount === 1 ? "" : "s"}
                </dd>
              </div>
            </dl>
          </Card>
        )}

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

      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        fee={FEE}
        onPaid={(token) => {
          setPayOpen(false);
          execute(token);
        }}
        phone={session?.user.phone}
      />
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
  onPaid: (checkToken: string) => void;
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
    try {
      const checkToken = await payForGuestCheck();
      toast.success("Payment received", { description: "Running your conflict check…" });
      onPaid(checkToken);
    } catch (err) {
      toast.error("Payment couldn't be completed", { description: describeError(err) });
    } finally {
      setPaying(false);
    }
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
