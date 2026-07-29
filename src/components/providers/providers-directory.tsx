"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Briefcase, MapPin, Search, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StarRating } from "@/components/shared/star-rating";
import { ReviewsList } from "@/components/shared/reviews-list";
import { getProviders } from "@/lib/api";
import { useSession } from "@/stores/session";
import { formatGHS } from "@/lib/format";
import type { ServiceCategory, ServiceProvider } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ value: ServiceCategory | "all"; label: string }> = [
  { value: "all", label: "All services" },
  { value: "surveyor", label: "Surveyors" },
  { value: "property-manager", label: "Property managers" },
  { value: "developer", label: "Developers" },
  { value: "electrician", label: "Electricians" },
  { value: "plumber", label: "Plumbers" },
  { value: "painter", label: "Painters" },
  { value: "photographer", label: "Photographers" },
];

const REGION_ITEMS = [
  { value: "all", label: "All regions" },
  ...["Greater Accra", "Ashanti", "Eastern", "Northern", "Central", "Volta", "Western"].map((r) => ({ value: r, label: r })),
];

export function ProvidersDirectory() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [region, setRegion] = useState("all");
  const [quoteFor, setQuoteFor] = useState<ServiceProvider | null>(null);
  const [profileFor, setProfileFor] = useState<ServiceProvider | null>(null);
  const [quoteMsg, setQuoteMsg] = useState("");
  const { session } = useSession();

  const { data: providers, isPending, isError, refetch } = useQuery({
    queryKey: ["providers", q, category, region],
    queryFn: () => getProviders({ q, category, region }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative min-w-0 flex-1 sm:max-w-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Label htmlFor="prov-q" className="sr-only">
            Search providers
          </Label>
          <Input
            id="prov-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, service or city…"
            className="h-10 pl-9"
          />
        </form>
        <div className="ml-auto">
          <Label htmlFor="prov-region" className="sr-only">
            Region
          </Label>
          <Select items={REGION_ITEMS} value={region} onValueChange={(v) => setRegion(v as string)}>
            <SelectTrigger id="prov-region" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGION_ITEMS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div role="tablist" aria-label="Service category" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            role="tab"
            aria-selected={category === c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              category === c.value
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isError ? (
          <EmptyState
            icon={SearchX}
            title="Couldn't load providers"
            action={<Button onClick={() => refetch()}>Try again</Button>}
          />
        ) : isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : providers!.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No providers match"
            description="Try a different category or region."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQ("");
                  setCategory("all");
                  setRegion("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {providers!.map((p) => (
              <Card key={p.id} className="gap-4 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Image src={p.avatarUrl} alt="" width={52} height={52} className="size-13 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-bold">
                      <span className="truncate">{p.name}</span>
                      {p.verified && <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Verified provider" />}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" aria-hidden /> {p.city} · {p.region}
                    </p>
                    <StarRating rating={p.rating} count={p.reviewsCount} className="mt-1" />
                  </div>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {p.services.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="size-3.5" aria-hidden /> {p.jobsDone} jobs · {p.yearsActive} yrs
                  </span>
                  <span>
                    from <span className="font-heading text-sm font-bold text-foreground">{formatGHS(p.startingPrice)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setProfileFor(p)}>
                    Profile &amp; reviews
                  </Button>
                  <Button
                    onClick={() => {
                      setQuoteMsg(`Hi ${p.name.split(" ")[0]}, I need help with ${p.services[0]?.toLowerCase() ?? "a project"} in ${p.city}.`);
                      setQuoteFor(p);
                    }}
                  >
                    Request quote
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* quote dialog */}
      <Dialog open={!!quoteFor} onOpenChange={(open) => !open && setQuoteFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request a quote from {quoteFor?.name}</DialogTitle>
            <DialogDescription>
              They typically respond within a business day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quote-msg">What do you need?</Label>
            <Textarea id="quote-msg" rows={4} value={quoteMsg} onChange={(e) => setQuoteMsg(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!quoteMsg.trim()}
              onClick={() => {
                setQuoteFor(null);
                toast.success("Quote request sent", {
                  description: session
                    ? `${quoteFor?.name} will reply to ${session.user.email}.`
                    : "Sign in to track replies in your messages.",
                });
              }}
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* profile dialog */}
      <Dialog open={!!profileFor} onOpenChange={(open) => !open && setProfileFor(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {profileFor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {profileFor.name}
                  {profileFor.verified && <BadgeCheck className="size-4 text-success" aria-label="Verified" />}
                </DialogTitle>
                <DialogDescription>
                  {CATEGORIES.find((c) => c.value === profileFor.category)?.label.replace(/s$/, "")} · {profileFor.city},{" "}
                  {profileFor.region} · {profileFor.jobsDone} jobs completed
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-muted-foreground">{profileFor.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {profileFor.services.map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
              <ReviewsList targetId={profileFor.id} targetType="provider" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
