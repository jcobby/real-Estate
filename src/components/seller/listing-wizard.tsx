"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FileUp,
  Keyboard,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Save,
  Search,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dropzone } from "@/components/shared/dropzone";
import { CoordinatePolygonInput } from "@/components/shared/coordinate-polygon-input";
import { GHANA_PLACES, searchPlaces, type GhanaPlace } from "@/data/ghana-places";
import { createEstate, createListing, getParcels, updateListing } from "@/lib/api";
import { applyApiError } from "@/lib/api/form-errors";
import { describeError } from "@/lib/api/http";
import { uploadFile } from "@/lib/api/uploads";
import { collectionCenter, generateParcelGrid, parcelFromRing, parseParcelFile } from "@/lib/geo";
import { formatSqm } from "@/lib/format";
import { useSession } from "@/stores/session";
import type { Listing, ParcelCollection } from "@/types";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const LocationPicker = dynamic(() => import("./location-picker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-2xl" />,
});

/* ------------------------------------------------------------------ */

const REGIONS = ["Greater Accra", "Ashanti", "Eastern", "Northern", "Central", "Volta", "Western", "Upper West"];

/** Self-hosted land photos used as stand-ins for a seller's "uploaded" images. */
const LAND_STOCK = Array.from({ length: 9 }, (_, i) => `/lands/land-${String(i + 1).padStart(2, "0")}.jpg`);
const stockPhoto = (i: number) => LAND_STOCK[((i % LAND_STOCK.length) + LAND_STOCK.length) % LAND_STOCK.length];
const AMENITIES = [
  "Electricity on site",
  "Piped water",
  "Tarred road access",
  "Gated community",
  "Walled & demarcated",
  "Drainage installed",
  "Street lights",
  "24/7 security post",
  "Close to school",
  "Close to market",
];

const DEFAULT_AGREEMENT =
  "This Sales & Purchase Agreement is entered into between the Vendor and the Purchaser upon acceptance of an offer on the RealEstate platform. The Vendor warrants a valid registered interest, free from encumbrances. The purchase price is paid into RealEstate escrow and released only after execution of the indenture and confirmation of title transfer.";
const DEFAULT_TERMS =
  "• A 10% commitment fee reserves the plot for 30 days.\n• All payments pass through RealEstate escrow — never pay outside the platform.\n• Documentation completes within 4–6 weeks of full payment.\n• Commitment fees are refundable within 14 days if verification uncovers a defect in title.";

const schema = z.object({
  // 1 — location
  region: z.string().min(1, "Pick a region"),
  city: z.string().min(2, "Enter the town/city"),
  address: z.string().min(4, "Describe the location"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  geoFileName: z.string().optional(),
  /** clickable plot map for buyers (grid-generated or from an uploaded file) */
  sellAsPlots: z.boolean(),
  gridRows: z.number().int().min(1, "Min 1").max(20, "Max 20"),
  gridCols: z.number().int().min(1, "Min 1").max(20, "Max 20"),
  gridRotation: z.number().min(-90).max(90),
  plotPrefix: z.string().min(1, "1–4 letters").max(4, "1–4 letters"),
  // 2 — description
  title: z.string().min(10, "At least 10 characters — make it descriptive"),
  description: z.string().min(60, "At least 60 characters help buyers trust the listing"),
  landStatus: z.enum(["developed", "semi-developed", "greenfield", "undeveloped"]),
  type: z.enum(["land", "house", "commercial"]),
  // 3 — features
  amenities: z.array(z.string()),
  dimensions: z.string().min(3, "e.g. 100 ft × 70 ft"),
  topography: z.string().min(3, "e.g. level, gently sloping"),
  titleType: z.string().min(3, "e.g. registered leasehold"),
  zoning: z.string().min(3, "e.g. residential"),
  // 4 — media
  images: z.array(z.string()).min(1, "Add at least one photo"),
  // 5 — documents
  documents: z.array(z.object({ name: z.string(), type: z.string() })),
  // 6 — terms
  salesAgreement: z.string().min(40),
  terms: z.string().min(40),
  negotiable: z.boolean(),
  // 7 — price
  price: z.number().min(1000, "Price looks too low (₵)"),
  plotsTotal: z.number().int().min(1),
  plotsAvailable: z.number().int().min(1),
});

type WizardValues = z.infer<typeof schema>;

const STEPS = [
  { title: "Map & coordinates", fields: ["region", "city", "address", "lat", "lng", "sellAsPlots", "gridRows", "gridCols", "gridRotation", "plotPrefix"] },
  { title: "Description", fields: ["title", "description", "landStatus", "type"] },
  { title: "Key features", fields: ["amenities", "dimensions", "topography", "titleType", "zoning"] },
  { title: "Photos & videos", fields: ["images"] },
  { title: "Documents", fields: ["documents"] },
  { title: "Terms", fields: ["salesAgreement", "terms", "negotiable"] },
  { title: "Price & publish", fields: ["price", "plotsTotal", "plotsAvailable"] },
] as const;

const DRAFT_KEY = "realestate:wizard-draft";

function defaults(listing?: Listing): WizardValues {
  return {
    region: listing?.region ?? "",
    city: listing?.city ?? "",
    address: listing?.address ?? "",
    lat: listing?.coords.lat ?? 5.65,
    lng: listing?.coords.lng ?? -0.187,
    geoFileName: undefined,
    sellAsPlots: true,
    gridRows: 4,
    gridCols: 5,
    gridRotation: 8,
    plotPrefix: "PL",
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    landStatus: listing?.landStatus ?? "semi-developed",
    type: listing?.type ?? "land",
    amenities: listing?.amenities ?? [],
    dimensions: listing?.attributes.dimensions ?? "100 ft × 70 ft per plot",
    topography: listing?.attributes.topography ?? "Level, graded terrain",
    titleType: listing?.attributes.titleType ?? "Registered leasehold (99 years)",
    zoning: listing?.attributes.zoning ?? "Residential",
    images: listing?.images ?? [],
    documents: listing?.documents.map((d) => ({ name: d.name, type: d.type })) ?? [],
    salesAgreement: listing?.salesAgreement ?? DEFAULT_AGREEMENT,
    terms: listing?.terms ?? DEFAULT_TERMS,
    negotiable: listing?.negotiable ?? true,
    price: listing?.price ?? 50000,
    plotsTotal: listing?.plotsTotal ?? 1,
    plotsAvailable: listing?.plotsAvailable ?? 1,
  };
}

/* ── step-1 presentational helpers ─────────────────────────────────── */

function SectionHead({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
        {n}
      </span>
      <div>
        <h3 className="font-heading text-base font-semibold leading-tight">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}


function MethodChip({
  active,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-primary bg-accent" : "hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}

export function ListingWizard({ listing }: { listing?: Listing }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const user = session!.user;
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);
  /** parcels drawn on the map or parsed from an upload — replaces the generated grid */
  const [fileParcels, setFileParcels] = useState<ParcelCollection | null>(null);
  const editing = !!listing;
  /** plot maps can be created for new listings AND when editing a listing that has none yet */
  const canConfigurePlots = !listing?.estateId;

  /* step-1 map helpers: fly-to a place, plot-creation method */
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; zoom?: number; nonce: number } | null>(null);
  const [plotMethod, setPlotMethod] = useState<"coordinates" | "upload">("coordinates");
  const [coordOpen, setCoordOpen] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const flyNonce = useRef(0);

  const flyTo = (lat: number, lng: number, zoom = 16) => {
    flyNonce.current += 1;
    setFocusTarget({ lat, lng, zoom, nonce: flyNonce.current });
  };

  const pickPlace = (place: GhanaPlace) => {
    setValue("lat", place.lat, { shouldValidate: true });
    setValue("lng", place.lng, { shouldValidate: true });
    if (!watch("region")) setValue("region", place.region, { shouldValidate: true });
    if (!watch("city")) setValue("city", place.name, { shouldValidate: true });
    flyTo(place.lat, place.lng, 15);
    setPlaceQuery(place.name);
    setPlaceOpen(false);
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
        setValue("lat", +pos.coords.latitude.toFixed(6), { shouldValidate: true });
        setValue("lng", +pos.coords.longitude.toFixed(6), { shouldValidate: true });
        flyTo(pos.coords.latitude, pos.coords.longitude, 17);
        toast.success("Jumped to your location", { description: "Now fine-tune the pin or draw your plot." });
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location", { description: "Allow location access, or search your town instead." });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  /** Switch how plots are created (type coordinates or upload a survey file). */
  const selectPlotMethod = (method: "coordinates" | "upload") => {
    setPlotMethod(method);
    setValue("sellAsPlots", true);
  };

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<WizardValues>({ resolver: zodResolver(schema), defaultValues: defaults(listing), mode: "onTouched" });

  // publicUrl → local object URL, so the seller sees the real photo they picked
  // even while the backend only has the (sandbox) stored URL.
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const values = watch();

  /* restore + autosave drafts (new listings only) */
  useEffect(() => {
    if (editing) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardValues>;
        delete parsed.geoFileName; // parsed file contents aren't persisted with the draft
        reset({ ...defaults(), ...parsed });
        toast("Draft restored", { description: "We autosave as you type — pick up where you left off." });
      }
    } catch {
      /* corrupt draft — start clean */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing) return;
    const sub = watch((vals) => {
      window.clearTimeout((sub as unknown as { t?: number }).t);
      (sub as unknown as { t?: number }).t = window.setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(vals));
        } catch {
          /* storage full */
        }
      }, 600);
    });
    return () => sub.unsubscribe();
  }, [watch, editing]);

  /* an existing estate's parcels, for the edit-mode preview */
  const { data: existingParcels } = useQuery({
    queryKey: ["parcels", listing?.estateId],
    queryFn: () => getParcels(listing!.estateId!),
    enabled: !!listing?.estateId,
  });

  /* live parcel preview on the step-1 map — mirrors exactly what publish will create */
  const previewParcels = useMemo<ParcelCollection | null>(() => {
    if (listing?.estateId) return existingParcels ?? null;
    // plots come from typed coordinates or an uploaded GeoJSON/KML file
    return fileParcels;
  }, [listing?.estateId, existingParcels, fileParcels]);

  /** "Draw plot" on the map traced a boundary — add it as a custom parcel. */
  const addDrawnParcel = (ring: number[][]) => {
    const idx = fileParcels?.features.length ?? 0;
    const feature = parcelFromRing(ring, idx, {
      estateId: "draft",
      fallbackPrice: Number.isFinite(values.price) && values.price > 0 ? Math.round(values.price) : 50000,
      fallbackOwner: user.company ?? user.name,
      plotNumber: `${(values.plotPrefix || "PL").toUpperCase()}-${String(idx + 1).padStart(3, "0")}`,
    });
    const nextFeatures = [...(fileParcels?.features ?? []), feature];
    setFileParcels({ type: "FeatureCollection", features: nextFeatures });
    setValue("sellAsPlots", true);
    setPlotMethod("coordinates");
    // the plots define the location — keep the listing's coords + map on them
    const c = collectionCenter({ type: "FeatureCollection", features: nextFeatures });
    setValue("lat", c.lat, { shouldValidate: true });
    setValue("lng", c.lng, { shouldValidate: true });
    flyTo(c.lat, c.lng, 16.5);
    toast.success(`Plot ${feature.properties.plotNumber} added — ${formatSqm(feature.properties.areaSqm)}`, {
      description: "Add more plots, or continue when the boundaries look right.",
    });
  };

  /** Remove one drawn/uploaded plot and renumber the rest. */
  const removeParcel = (index: number) => {
    const prefix = (values.plotPrefix || "PL").toUpperCase();
    const rest = (fileParcels?.features ?? []).filter((_, i) => i !== index);
    if (rest.length === 0) {
      setFileParcels(null);
      setValue("geoFileName", undefined);
      return;
    }
    setFileParcels({
      type: "FeatureCollection",
      features: rest.map((f, i) => ({
        ...f,
        properties: {
          ...f.properties,
          // keep uploaded plot numbers; renumber our own drawn PL-/prefix ones
          plotNumber: values.geoFileName ? f.properties.plotNumber : `${prefix}-${String(i + 1).padStart(3, "0")}`,
        },
      })),
    });
  };

  /* a plot map fixes the plot counts: grid = rows×cols, draw/upload = drawn count */
  const drawnCount = fileParcels?.features.length ?? 0;
  const parcelCount = drawnCount;
  /** true once the chosen plot method actually has plots ready */
  const plotsReady = drawnCount > 0;
  useEffect(() => {
    if (!canConfigurePlots || !values.sellAsPlots || !Number.isFinite(parcelCount) || parcelCount < 1) return;
    setValue("plotsTotal", parcelCount);
    setValue("plotsAvailable", parcelCount);
  }, [canConfigurePlots, values.sellAsPlots, parcelCount, setValue]);

  const next = async () => {
    const ok = await trigger(STEPS[step].fields as unknown as (keyof WizardValues)[]);
    if (!ok) return;
    if (step === 0 && !plotsReady) {
      toast.error("Add at least one plot", {
        description: "Enter a plot's coordinates or upload a GeoJSON/KML survey file.",
      });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const toPayload = (v: WizardValues, status: Listing["status"]) => ({
    title: v.title,
    type: v.type,
    landStatus: v.landStatus,
    price: v.price,
    negotiable: v.negotiable,
    region: v.region,
    city: v.city,
    address: v.address,
    coords: { lat: v.lat, lng: v.lng },
    sizeAcres: +(v.plotsTotal * 0.16).toFixed(2),
    plotsTotal: v.plotsTotal,
    plotsAvailable: Math.min(v.plotsAvailable, v.plotsTotal),
    images: v.images,
    description: v.description,
    amenities: v.amenities,
    verification: listing?.verification ?? ("unverified" as const),
    sellerId: user.id,
    sellerType: (user.company ? "developer" : "owner") as Listing["sellerType"],
    status,
    attributes: {
      dimensions: v.dimensions,
      lotSize: `${v.plotsTotal} plot${v.plotsTotal > 1 ? "s" : ""}`,
      elevation: listing?.attributes.elevation ?? "60–100 m above sea level",
      topography: v.topography,
      titleType: v.titleType,
      boundaryStatus: listing?.attributes.boundaryStatus ?? "Pillared by a licensed surveyor",
      zoning: v.zoning,
      soil: listing?.attributes.soil ?? "Sandy loam",
      environmental: listing?.attributes.environmental ?? "Outside flood-prone zones",
      naturalFeatures: listing?.attributes.naturalFeatures ?? [],
    },
    documents: v.documents.map((d, i) => ({
      id: `${Date.now()}-doc-${i}`,
      name: d.name,
      type: d.type as Listing["documents"][number]["type"],
      sizeKb: 300 + i * 120,
      uploadedAt: new Date().toISOString(),
      verified: false,
    })),
    salesAgreement: v.salesAgreement,
    terms: v.terms,
  });

  const publish = async (v: WizardValues) => {
    // hard re-entry guard — double submit events must never create two listings
    if (publishingRef.current) return;
    publishingRef.current = true;
    setPublishing(true);
    try {
      // a new plot map can be created on publish OR when editing a listing without one
      const wantsParcels = canConfigurePlots && (v.sellAsPlots || !!fileParcels);
      let estateId = wantsParcels ? `est-${Date.now().toString(36)}` : listing?.estateId;

      let listingId: string;
      if (editing) {
        await updateListing(listing.id, { ...toPayload(v, listing.status), estateId });
        listingId = listing.id;
      } else {
        const created = await createListing({ ...toPayload(v, "active"), estateId });
        listingId = created.id;
      }

      if (wantsParcels && estateId) {
        const eid = estateId; // narrowed to string for use inside the map closure below
        const owner = user.company ?? user.name;
        const price = Math.round(v.price);
        // re-key uploaded parcels to the real estate id; otherwise generate the grid
        const parcels: ParcelCollection = fileParcels
          ? {
              type: "FeatureCollection",
              features: fileParcels.features.map((f, i) => ({
                ...f,
                properties: {
                  ...f.properties,
                  id: `${eid}-${String(i + 1).padStart(3, "0")}`,
                  estateId: eid,
                },
              })),
            }
          : generateParcelGrid({
              estateId,
              center: { lat: v.lat, lng: v.lng },
              rows: v.gridRows,
              cols: v.gridCols,
              rotationDeg: v.gridRotation,
              prefix: v.plotPrefix.toUpperCase(),
              price,
              owner,
            });
        const center = fileParcels ? collectionCenter(parcels) : { lat: v.lat, lng: v.lng };
        const estate = await createEstate(
          {
            id: estateId,
            name: v.title,
            region: v.region,
            city: v.city,
            center,
            zoom: 16,
            listingId,
            description: v.description.slice(0, 180),
          },
          parcels,
        );
        estateId = estate.id; // the backend assigns the real id — use it for the redirect
        queryClient.invalidateQueries({ queryKey: ["estates"] });
        queryClient.invalidateQueries({ queryKey: ["all-parcels"] });
      }

      if (!editing) localStorage.removeItem(DRAFT_KEY);
      toast.success(editing ? "Listing updated" : "Listing published!", {
        description: wantsParcels
          ? `${v.plotsTotal} plots are now selectable on the map — buyers can tap and buy them.`
          : editing
            ? undefined
            : "Submit its documents for verification to earn the trust badge.",
      });
      router.push(
        wantsParcels ? `/map?estate=${estateId}` : editing ? "/seller/listings" : `/property/${listingId}`,
      );
    } catch (e) {
      applyApiError(e, setError, { fallback: editing ? "Couldn't update the listing" : "Couldn't publish the listing" });
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  const saveDraft = async () => {
    const v = watch();
    if (!v.title) {
      toast.error("Give the listing a title before saving a draft");
      return;
    }
    try {
      await createListing(toPayload({ ...defaults(), ...v, images: v.images.length ? v.images : [stockPhoto(0)] }, "draft"));
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Draft saved to your listings");
      router.push("/seller/listings");
    } catch (e) {
      applyApiError(e, setError, { fallback: "Couldn't save the draft" });
    }
  };

  const err = (k: keyof WizardValues) =>
    errors[k] && (
      <p role="alert" className="text-xs font-medium text-destructive">
        {errors[k]?.message as string}
      </p>
    );

  const addPhotos = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      toast.error("Add photos", { description: "JPG, PNG or WebP images only." });
      return;
    }
    const room = 20 - values.images.length;
    const toUpload = images.slice(0, Math.max(0, room));
    if (!toUpload.length) {
      toast.error("You can add up to 20 photos");
      return;
    }
    const tid = toast.loading(`Uploading ${toUpload.length} photo${toUpload.length > 1 ? "s" : ""}…`);
    try {
      const results = await Promise.all(toUpload.map((f) => uploadFile(f, "listing-image")));
      setPreviews((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.previewUrl) next[r.publicUrl] = r.previewUrl;
        return next;
      });
      setValue("images", [...values.images, ...results.map((r) => r.publicUrl)], { shouldValidate: true });
      toast.success(`${toUpload.length} photo${toUpload.length > 1 ? "s" : ""} added`, { id: tid });
    } catch (e) {
      toast.error("Couldn't upload the photos", { id: tid, description: describeError(e) });
    }
  };

  const addDocs = (files: File[]) => {
    const docs = files.map((f) => ({
      name: f.name,
      type: /indenture/i.test(f.name) ? "indenture" : /site/i.test(f.name) ? "site-plan" : /survey/i.test(f.name) ? "surveyor-report" : "other",
    }));
    setValue("documents", [...values.documents, ...docs], { shouldValidate: true });
    toast.success(`${docs.length} document${docs.length > 1 ? "s" : ""} attached`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        {/* stepper */}
        <ol className="no-scrollbar mb-8 flex gap-2 overflow-x-auto" aria-label="Wizard progress">
          {STEPS.map((s, i) => (
            <li key={s.title} className="shrink-0">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  i === step && "border-transparent bg-secondary text-secondary-foreground",
                  i < step && "border-transparent bg-success/15 text-success",
                  i > step && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-4.5 items-center justify-center rounded-full text-[10px]",
                    i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>

        <form
          // only the final step may submit — blocks Enter-key submits on earlier
          // steps and any stray submit events during step transitions
          onSubmit={(e) => {
            e.preventDefault();
            if (step === STEPS.length - 1) void handleSubmit(publish)(e);
          }}
          noValidate
        >
          <Card className="gap-6 rounded-2xl p-6">
            <h2 className="font-heading text-lg font-bold">
              {step + 1}. {STEPS[step].title}
            </h2>

            {step === 0 && (
              <div className="space-y-8">
                {/* ── A · WHERE IS YOUR LAND ───────────────────────────── */}
                <section className="space-y-4">
                  <SectionHead n={1} title="Where is your land?" hint="Choose the region and town, then find the exact spot on the map." />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="wiz-region">Region</Label>
                      <Select
                        items={REGIONS.map((r) => ({ value: r, label: r }))}
                        value={values.region || null}
                        onValueChange={(v) => setValue("region", (v as string) ?? "", { shouldValidate: true })}
                      >
                        <SelectTrigger id="wiz-region" className="w-full" aria-invalid={!!errors.region}>
                          <SelectValue placeholder="Choose a region" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {err("region")}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wiz-city">Town / city</Label>
                      <Input id="wiz-city" placeholder="e.g. Oyibi" aria-invalid={!!errors.city} {...register("city")} />
                      {err("city")}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-address">Address / nearest landmark</Label>
                    <Input id="wiz-address" placeholder="e.g. Off the Adenta–Dodowa road, near the school" aria-invalid={!!errors.address} {...register("address")} />
                    {err("address")}
                  </div>

                  {/* find-on-map: town search + use-my-location */}
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-place">Find it on the map</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="wiz-place"
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
                                  onClick={() => pickPlace(p)}
                                >
                                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
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
                  </div>
                </section>

                {/* ── B · HOW SHOULD BUYERS BUY IT (decide before the map) ── */}
                {!canConfigurePlots ? (
                  <p className="flex items-start gap-2 rounded-xl bg-accent px-3.5 py-3 text-xs text-accent-foreground">
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                    This listing already has a live plot map (shown below). Its boundaries are locked because buyers
                    may already have reserved or bought plots.
                  </p>
                ) : (
                  <section className="space-y-4">
                    <SectionHead n={2} title="Mark your plots" hint="Buyers tap the exact plots they want and buy with escrow." />

                    {values.sellAsPlots && (
                      <div className="space-y-4 rounded-2xl border p-4">
                        <div>
                          <p className="text-sm font-semibold">Create your plots by…</p>
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" role="tablist" aria-label="Plot creation method">
                            <MethodChip active={plotMethod === "coordinates"} icon={Keyboard} label="Enter coordinates" hint="Type each corner" onClick={() => selectPlotMethod("coordinates")} />
                            <MethodChip active={plotMethod === "upload"} icon={UploadCloud} label="Upload GeoJSON/KML" hint="Surveyor file" onClick={() => selectPlotMethod("upload")} />
                          </div>
                        </div>

                        {/* COORDINATES — add each plot by typed corners */}
                        {plotMethod === "coordinates" && (
                          <div className="space-y-2.5">
                            <div className="flex items-start gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-xs text-accent-foreground">
                              <Keyboard className="mt-0.5 size-4 shrink-0" aria-hidden />
                              <p>
                                Type each corner of a plot (latitude &amp; longitude). Every set of corners becomes one
                                selectable plot — add as many plots as you need.
                              </p>
                            </div>
                            <Button type="button" size="sm" onClick={() => setCoordOpen(true)}>
                              <Keyboard data-icon="inline-start" /> Add a plot by coordinates
                            </Button>
                          </div>
                        )}

                        {/* UPLOAD */}
                        {plotMethod === "upload" && (
                          <div className="space-y-3">
                            <Dropzone
                              label="Drop a GeoJSON or KML file of your surveyed parcels"
                              hint="Each polygon becomes a selectable plot (plotNumber, price and status properties are honoured)"
                              accept=".geojson,.json,.kml,.kmz"
                              multiple={false}
                              onFiles={async (files) => {
                                try {
                                  const fc = await parseParcelFile(files[0], {
                                    estateId: "draft",
                                    fallbackPrice: Math.round(values.price) || 50000,
                                    fallbackOwner: user.company ?? user.name,
                                  });
                                  setFileParcels(fc);
                                  const center = collectionCenter(fc);
                                  setValue("geoFileName", files[0].name);
                                  setValue("sellAsPlots", true);
                                  setValue("lat", center.lat, { shouldValidate: true });
                                  setValue("lng", center.lng, { shouldValidate: true });
                                  flyTo(center.lat, center.lng, 16);
                                  toast.success(`Parsed ${fc.features.length} parcels from ${files[0].name}`, {
                                    description: "The map has jumped to them — they'll be selectable once you publish.",
                                  });
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Couldn't parse that file");
                                }
                              }}
                            />
                            {values.geoFileName && fileParcels && (
                              <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                                <Check className="size-4 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">
                                  {values.geoFileName} — {fileParcels.features.length} plots ready
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  className="ml-auto text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setFileParcels(null);
                                    setValue("geoFileName", undefined);
                                  }}
                                >
                                  Remove
                                </Button>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* ── C · THE MAP — a read-only preview of the plots ── */}
                <section className="space-y-3">
                  <SectionHead
                    n={3}
                    title="Your plots on the map"
                    hint="A preview of exactly what buyers will see — the plots you add above appear here on the satellite map."
                  />

                  <LocationPicker
                    lat={values.lat}
                    lng={values.lng}
                    parcels={previewParcels}
                    allowDraw={false}
                    readOnly
                    drawnCount={drawnCount}
                    focusTarget={focusTarget}
                    onDrawParcel={addDrawnParcel}
                    onChange={({ lat, lng }) => {
                      setValue("lat", lat, { shouldValidate: true });
                      setValue("lng", lng, { shouldValidate: true });
                    }}
                  />

                  {previewParcels ? (
                    <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                      <Check className="size-4 shrink-0" aria-hidden />
                      {previewParcels.features.length} plot{previewParcels.features.length > 1 ? "s" : ""} ready — buyers can tap and buy each one.
                    </p>
                  ) : (
                    <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                      No plots yet — add them above with <span className="font-medium text-foreground">Enter coordinates</span> or by uploading a GeoJSON / KML file.
                    </p>
                  )}

                  {/* drawn plots list — right under the map you drew them on */}
                  {canConfigurePlots && drawnCount > 0 && !values.geoFileName && (
                    <ul className="divide-y rounded-xl border">
                      {fileParcels!.features.map((f, i) => (
                        <li key={f.properties.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="flex size-6 items-center justify-center rounded-md bg-success/15 text-xs font-bold text-success">
                            {i + 1}
                          </span>
                          <span className="font-mono font-semibold">{f.properties.plotNumber}</span>
                          <span className="text-xs text-muted-foreground">{formatSqm(f.properties.areaSqm)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove ${f.properties.plotNumber}`}
                            className="ml-auto text-destructive hover:text-destructive"
                            onClick={() => removeParcel(i)}
                          >
                            <Trash2 />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wiz-title">Listing title</Label>
                  <Input id="wiz-title" placeholder="e.g. 2-plot serviced land at Oyibi, titled & walled" aria-invalid={!!errors.title} {...register("title")} />
                  {err("title")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wiz-desc">Description</Label>
                  <Textarea id="wiz-desc" rows={6} placeholder="What makes this land worth buying? Access roads, utilities, documents, neighbourhood…" aria-invalid={!!errors.description} {...register("description")} />
                  <p className="text-xs text-muted-foreground">{values.description.length} characters</p>
                  {err("description")}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-status">Land status</Label>
                    <Select
                      items={[
                        { value: "developed", label: "Developed" },
                        { value: "semi-developed", label: "Semi-developed" },
                        { value: "greenfield", label: "Greenfield" },
                        { value: "undeveloped", label: "Undeveloped" },
                      ]}
                      value={values.landStatus}
                      onValueChange={(v) => setValue("landStatus", v as WizardValues["landStatus"])}
                    >
                      <SelectTrigger id="wiz-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["developed", "semi-developed", "greenfield", "undeveloped"].map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-type">Property type</Label>
                    <Select
                      items={[
                        { value: "land", label: "Land" },
                        { value: "house", label: "House" },
                        { value: "commercial", label: "Commercial" },
                      ]}
                      value={values.type}
                      onValueChange={(v) => setValue("type", v as WizardValues["type"])}
                    >
                      <SelectTrigger id="wiz-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["land", "house", "commercial"].map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-2.5 text-sm font-medium">Amenities on or near the land</legend>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {AMENITIES.map((a) => (
                      <div key={a} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`wiz-am-${a}`}
                          checked={values.amenities.includes(a)}
                          onCheckedChange={(v) =>
                            setValue("amenities", v ? [...values.amenities, a] : values.amenities.filter((x) => x !== a))
                          }
                        />
                        <Label htmlFor={`wiz-am-${a}`} className="text-sm font-normal text-muted-foreground">
                          {a}
                        </Label>
                      </div>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["dimensions", "Plot dimensions", "100 ft × 70 ft"],
                      ["topography", "Topography", "Level, graded terrain"],
                      ["titleType", "Title type", "Registered leasehold (99 years)"],
                      ["zoning", "Zoning", "Residential"],
                    ] as const
                  ).map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`wiz-${key}`}>{label}</Label>
                      <Input id={`wiz-${key}`} placeholder={placeholder} aria-invalid={!!errors[key]} {...register(key)} />
                      {err(key)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Dropzone
                  label="Drop photos or videos here, or click to browse"
                  hint="JPG, PNG or WebP — clear daytime photos of the land sell best"
                  accept="image/*,video/*"
                  onFiles={addPhotos}
                />
                {err("images")}
                {values.images.length > 0 && (
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {values.images.map((src, i) => (
                      <li key={src} className="group relative aspect-[4/3] overflow-hidden rounded-xl border">
                        <Image src={previews[src] ?? src} alt={`Photo ${i + 1}`} fill sizes="150px" className="object-cover" />
                        <button
                          type="button"
                          aria-label={`Remove photo ${i + 1}`}
                          onClick={() => setValue("images", values.images.filter((x) => x !== src), { shouldValidate: true })}
                          className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Trash2 className="size-3.5 text-destructive" aria-hidden />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            Cover
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Dropzone
                  label="Upload supporting documents"
                  hint="Indenture, site plan, surveyor's report, ID — needed for the Verified badge"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                  onFiles={addDocs}
                />
                {values.documents.length > 0 ? (
                  <ul className="space-y-2">
                    {values.documents.map((doc, i) => (
                      <li key={`${doc.name}-${i}`} className="flex items-center gap-3 rounded-xl border px-4 py-2.5">
                        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm">{doc.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                          {doc.type}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${doc.name}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setValue("documents", values.documents.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <FileUp className="mr-1 inline size-4" aria-hidden />
                    You can publish without documents, but unverified listings get ~4× fewer leads.
                  </p>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wiz-agreement">Sales agreement (shown to buyers)</Label>
                  <Textarea id="wiz-agreement" rows={6} aria-invalid={!!errors.salesAgreement} {...register("salesAgreement")} />
                  {err("salesAgreement")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wiz-terms">Terms &amp; conditions</Label>
                  <Textarea id="wiz-terms" rows={5} aria-invalid={!!errors.terms} {...register("terms")} />
                  {err("terms")}
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">Price is negotiable</p>
                    <p className="text-xs text-muted-foreground">Buyers can send offers below asking price</p>
                  </div>
                  <Switch
                    checked={values.negotiable}
                    onCheckedChange={(v) => setValue("negotiable", v)}
                    aria-label="Price negotiable"
                  />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-price">Price per plot (₵)</Label>
                    <Input id="wiz-price" type="number" min={0} aria-invalid={!!errors.price} {...register("price", { valueAsNumber: true })} />
                    {err("price")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-total">Total plots</Label>
                    <Input id="wiz-total" type="number" min={1} disabled={values.sellAsPlots && canConfigurePlots} aria-invalid={!!errors.plotsTotal} {...register("plotsTotal", { valueAsNumber: true })} />
                    {values.sellAsPlots && canConfigurePlots && <p className="text-xs text-muted-foreground">Set by your plot map</p>}
                    {err("plotsTotal")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-avail">Plots available</Label>
                    <Input id="wiz-avail" type="number" min={1} disabled={values.sellAsPlots && canConfigurePlots} aria-invalid={!!errors.plotsAvailable} {...register("plotsAvailable", { valueAsNumber: true })} />
                    {err("plotsAvailable")}
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-5">
                  <h3 className="text-sm font-semibold">Review before publishing</h3>
                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    {(
                      [
                        ["Title", values.title || "—"],
                        ["Location", values.city ? `${values.city}, ${values.region}` : "—"],
                        ["Land status", values.landStatus.replace("-", " ")],
                        ["Photos", `${values.images.length}`],
                        ["Documents", `${values.documents.length}`],
                        ["Amenities", `${values.amenities.length} selected`],
                        ["Coordinates", `${Number(values.lat).toFixed(4)}, ${Number(values.lng).toFixed(4)}`],
                        [
                          "Plot map",
                          canConfigurePlots
                            ? fileParcels
                              ? `${fileParcels.features.length} plot${fileParcels.features.length > 1 ? "s" : ""}`
                              : "None added yet"
                            : "Existing plot map (locked)",
                        ],
                        ["Price", `₵${Number(values.price).toLocaleString()} / plot`],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-dashed py-1 last:border-0">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="truncate font-medium capitalize">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t pt-5">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft data-icon="inline-start" /> Back
                </Button>
              )}
              {!editing && (
                <Button type="button" variant="ghost" onClick={saveDraft}>
                  <Save data-icon="inline-start" /> Save draft
                </Button>
              )}
              <span className="flex-1" />
              {/* distinct keys: never let React morph Continue into the submit button
                  under an in-flight click (that used to fire a premature submit) */}
              {step < STEPS.length - 1 ? (
                <Button key="continue" type="button" onClick={next}>
                  Continue <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button key="publish" type="submit" size="lg" disabled={publishing}>
                  {publishing && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                  {publishing ? "Publishing…" : editing ? "Save changes" : "Publish listing"}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>

      {/* enter a plot boundary by typed coordinates */}
      <Dialog open={coordOpen} onOpenChange={setCoordOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enter plot coordinates</DialogTitle>
            <DialogDescription>
              Type each corner of the plot. We arrange them into a clean boundary and add it to your plot map.
            </DialogDescription>
          </DialogHeader>
          <CoordinatePolygonInput
            submitLabel="Add this plot"
            onCancel={() => setCoordOpen(false)}
            onPlot={(ring) => {
              addDrawnParcel(ring);
              setCoordOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
