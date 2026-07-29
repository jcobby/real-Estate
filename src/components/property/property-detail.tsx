"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  FileText,
  Grid2x2,
  MapPin,
  Mountain,
  Ruler,
  ScrollText,
  SearchX,
  Share2,
  ShoppingCart,
  Sprout,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { LandStatusBadge, VerificationBadge } from "@/components/shared/badges";
import { ListingCard } from "@/components/listings/listing-card";
import { Gallery } from "./gallery";
import { AgentCard } from "./agent-card";
import { AffordabilityCalculator } from "./calculator";
import { getListing, getSimilarListings, pushNotification, recordView } from "@/lib/api";
import { useFavorites } from "@/stores/favorites";
import { useSession } from "@/stores/session";
import { formatDate, formatGHS } from "@/lib/format";

const ParcelPreview = dynamic(() => import("./parcel-preview").then((m) => m.ParcelPreview), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-2xl" />,
});

export function PropertyDetail({ id }: { id: string }) {
  const router = useRouter();
  const { session } = useSession();
  const pushRecentlyViewed = useFavorites((s) => s.pushRecentlyViewed);
  const [reserveOpen, setReserveOpen] = useState(false);

  const { data: listing, isPending, isError, refetch } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  const { data: similar } = useQuery({
    queryKey: ["similar", id],
    queryFn: () => getSimilarListings(id),
    enabled: !!listing,
  });

  useEffect(() => {
    if (listing) {
      pushRecentlyViewed(listing.id);
      recordView(listing.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (isPending) return <DetailSkeleton />;

  if (isError || !listing) {
    return (
      <EmptyState
        icon={SearchX}
        title="Listing not found"
        description="It may have been sold or removed by moderation."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
            <Button render={<Link href="/listings" />}>Browse listings</Button>
          </div>
        }
      />
    );
  }

  const buy = () => {
    if (listing.estateId) {
      // scroll to the inline plot map on this page — buyers pick & buy right here
      document.getElementById("plot-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast("Tap the plots you want on the map", { description: "Then press Buy under the map." });
      return;
    }
    if (!session) {
      toast("Sign in to start a purchase", { description: "Escrow-protected buying needs an account." });
      router.push("/login");
      return;
    }
    router.push(`/checkout?listing=${listing.id}`);
  };

  const reserve = () => {
    pushNotification({
      userId: listing.sellerId,
      type: "listing",
      title: "New reservation request",
      body: `${session?.user.name ?? "A buyer"} asked to reserve "${listing.title}"`,
      href: "/seller/leads",
    });
    setReserveOpen(false);
    toast.success("Reservation request sent", {
      description: "The seller will hold the plot for 48h while you complete checks.",
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <article>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/listings" />}>Listings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-52 truncate">{listing.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Gallery images={listing.images} title={listing.title} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge status={listing.verification} />
            <LandStatusBadge status={listing.landStatus} />
            {listing.negotiable && <Badge variant="outline">Negotiable</Badge>}
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden /> Listed {formatDate(listing.createdAt)}
            </span>
          </div>

          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {listing.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {listing.address} · {listing.region} Region
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Ruler, label: "Size", value: `${listing.sizeAcres} acres` },
              { icon: Grid2x2, label: "Plots left", value: `${listing.plotsAvailable}/${listing.plotsTotal}` },
              { icon: Mountain, label: "Topography", value: listing.attributes.topography.split(" ").slice(0, 2).join(" ") },
              { icon: Sprout, label: "Zoning", value: listing.attributes.zoning },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border bg-card p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <f.icon className="size-3.5" aria-hidden /> {f.label}
                </dt>
                <dd className="mt-1 truncate text-sm font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>

          {listing.estateId && (
            <div id="plot-map" className="mt-8 scroll-mt-20">
              <h2 className="font-heading text-lg font-bold">Pick your plots from the sky</h2>
              <p className="mt-1 mb-3 text-sm text-muted-foreground">
                Tap the exact plots you want on the satellite map, then buy them together with escrow protection.
              </p>
              <ParcelPreview estateId={listing.estateId} />
            </div>
          )}

          <Tabs defaultValue="about" className="mt-8">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="attributes">Land attributes</TabsTrigger>
              <TabsTrigger value="agreement">Sales agreement</TabsTrigger>
              <TabsTrigger value="terms">Terms &amp; conditions</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-4">
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{listing.description}</p>
              {listing.amenities.length > 0 && (
                <>
                  <h3 className="mt-6 mb-3 text-sm font-semibold">Amenities &amp; services</h3>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {listing.amenities.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="size-4 text-success" aria-hidden /> {a}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>

            <TabsContent value="attributes" className="mt-4">
              <dl className="divide-y rounded-2xl border">
                {[
                  ["Status", listing.landStatus.replace("-", " ")],
                  ["Dimensions", listing.attributes.dimensions],
                  ["Lot size", listing.attributes.lotSize],
                  ["Elevation", listing.attributes.elevation],
                  ["Topography", listing.attributes.topography],
                  ["Title type", listing.attributes.titleType],
                  ["Boundary status", listing.attributes.boundaryStatus],
                  ["Zoning", listing.attributes.zoning],
                  ["Soil", listing.attributes.soil],
                  ["Environmental", listing.attributes.environmental],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
                    <dt className="text-sm font-medium text-muted-foreground capitalize">{label}</dt>
                    <dd className="text-sm capitalize">{value}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
                  <dt className="text-sm font-medium text-muted-foreground">Natural features</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {listing.attributes.naturalFeatures.map((f) => (
                      <Badge key={f} variant="outline">
                        {f}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </TabsContent>

            <TabsContent value="agreement" className="mt-4">
              <div className="rounded-2xl border bg-muted/30 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ScrollText className="size-4 text-primary" aria-hidden /> Sales &amp; purchase agreement (template)
                </h3>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {listing.salesAgreement}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="terms" className="mt-4">
              <div className="rounded-2xl border bg-muted/30 p-5">
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{listing.terms}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-5">
          <Card className="gap-4 rounded-2xl p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Price per plot</p>
              <p className="font-heading text-3xl font-bold">{formatGHS(listing.price)}</p>
              {listing.plotsTotal > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Whole parcel ≈ {formatGHS(listing.price * listing.plotsTotal)}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Button size="lg" className="h-11" onClick={buy}>
                <ShoppingCart data-icon="inline-start" />
                {listing.estateId ? "Buy — choose plots on map" : "Buy this land"}
              </Button>
              <Button variant="outline" size="lg" className="h-11" onClick={() => setReserveOpen(true)}>
                Reserve for 48h
              </Button>
              <div className="flex gap-2">
                <FavoriteButton listingId={listing.id} withLabel className="flex-1 justify-center border bg-background py-2.5 shadow-none" />
                <Button variant="outline" className="flex-1" onClick={share}>
                  <Share2 data-icon="inline-start" /> Share
                </Button>
              </div>
            </div>
            <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
              Escrow-protected — funds are released to the seller only after title handover.
            </p>
          </Card>

          <Card className="gap-3 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold">Verification</h2>
              <VerificationBadge status={listing.verification} />
            </div>
            <p className="text-xs text-muted-foreground">
              {listing.verification === "verified"
                ? "Our documents team checked the following against Lands Commission records:"
                : listing.verification === "pending"
                  ? "Documents are with our verification team. What gets checked:"
                  : "This listing hasn't submitted documents yet. A verified listing includes:"}
            </p>
            <ul className="space-y-2">
              {listing.documents.length > 0
                ? listing.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                      {doc.verified ? (
                        <Badge className="bg-success text-success-foreground">
                          <Check className="size-3" /> Checked
                        </Badge>
                      ) : (
                        <Badge variant="outline">In review</Badge>
                      )}
                    </li>
                  ))
                : ["Registered indenture", "Approved site plan", "Surveyor's report", "Seller ID"].map((d) => (
                    <li key={d} className="flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                      <FileText className="size-4 shrink-0" aria-hidden /> {d}
                    </li>
                  ))}
            </ul>
          </Card>

          <AgentCard listing={listing} />
          <AffordabilityCalculator price={listing.price} />
        </aside>
      </div>

      {similar && similar.length > 0 && (
        <section aria-label="Similar listings" className="mt-14 border-t pt-8">
          <h2 className="font-heading text-xl font-bold">Similar land nearby</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reserve this land for 48 hours?</DialogTitle>
            <DialogDescription>
              The seller will hold it while you do checks or arrange payment. A 10% commitment fee applies if you
              proceed to purchase (fully refundable if verification fails).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={reserve}>Request reservation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-64" />
      <Skeleton className="aspect-[16/7] w-full rounded-2xl" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-56" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
