"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CircleX,
  CreditCard,
  LoaderCircle,
  Map,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getListing, startPurchase } from "@/lib/api";
import { SQM_PER_PLOT, formatAcres, formatGHS, formatSqft, formatSqm } from "@/lib/format";
import { useSelection } from "@/stores/selection";
import { useSession } from "@/stores/session";
import type { PaymentMethod, Purchase, PurchasePlot } from "@/types";
import { cn } from "@/lib/utils";

const paymentSchema = z
  .object({
    method: z.enum(["mtn-momo", "vodafone-cash", "card"]),
    momoNumber: z.string().optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
    simulateFailure: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.method !== "card") {
      if (!v.momoNumber || !/^\+?[\d\s]{9,15}$/.test(v.momoNumber)) {
        ctx.addIssue({ code: "custom", path: ["momoNumber"], message: "Enter a valid mobile-money number" });
      }
    } else {
      if (!v.cardNumber || v.cardNumber.replace(/\s/g, "").length < 12) {
        ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Enter a valid card number" });
      }
      if (!v.cardExpiry || !/^\d{2}\/\d{2}$/.test(v.cardExpiry)) {
        ctx.addIssue({ code: "custom", path: ["cardExpiry"], message: "MM/YY" });
      }
      if (!v.cardCvc || !/^\d{3,4}$/.test(v.cardCvc)) {
        ctx.addIssue({ code: "custom", path: ["cardCvc"], message: "3–4 digits" });
      }
    }
  });

type PaymentValues = z.infer<typeof paymentSchema>;

const METHODS: Array<{ value: PaymentMethod; label: string; hint: string; icon: typeof Smartphone }> = [
  { value: "mtn-momo", label: "MTN MoMo", hint: "Instant wallet debit", icon: Smartphone },
  { value: "vodafone-cash", label: "Telecel / Vodafone Cash", hint: "Wallet-to-escrow transfer", icon: Smartphone },
  { value: "card", label: "Card", hint: "Visa, Mastercard & more", icon: CreditCard },
];

type Phase = "review" | "pay" | "processing" | "success" | "failed";

export function CheckoutFlow() {
  const searchParams = useSearchParams();
  const { session } = useSession();
  const user = session!.user;

  const listingId = searchParams.get("listing");
  const selected = useSelection((s) => s.selected);
  const removePlot = useSelection((s) => s.removePlot);
  const clearSelection = useSelection((s) => s.clearSelection);

  const [phase, setPhase] = useState<Phase>("review");
  const [qty, setQty] = useState(1);
  const [result, setResult] = useState<Purchase | null>(null);
  const [failMessage, setFailMessage] = useState("");

  const { data: listing, isPending: listingPending } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => getListing(listingId!),
    enabled: !!listingId,
  });

  /** Order lines: either the map selection or a listing-based purchase. */
  const plots: PurchasePlot[] = useMemo(() => {
    if (listingId && listing) {
      return Array.from({ length: qty }).map((_, i) => ({
        parcelId: `${listing.id}-plot-${i + 1}`,
        plotNumber: `PLOT ${i + 1} of ${qty}`,
        estateId: listing.estateId ?? listing.id,
        estateName: listing.title,
        areaSqm: SQM_PER_PLOT,
        price: listing.price,
      }));
    }
    return selected.map((p) => ({
      parcelId: p.id,
      plotNumber: p.plotNumber,
      estateId: p.estateId,
      estateName: p.estateName,
      areaSqm: p.areaSqm,
      price: p.price,
    }));
  }, [listingId, listing, qty, selected]);

  const totalSqm = plots.reduce((s, p) => s + p.areaSqm, 0);
  const amount = plots.reduce((s, p) => s + p.price, 0);
  const fees = Math.round(amount * 0.02);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "mtn-momo", momoNumber: user.phone, simulateFailure: false },
  });
  const method = watch("method");

  const pay = async (values: PaymentValues) => {
    setPhase("processing");
    try {
      const purchase = await startPurchase({
        buyerId: user.id,
        plots,
        paymentMethod: values.method,
        simulateFailure: values.simulateFailure,
      });
      setResult(purchase);
      if (!listingId) clearSelection();
      setPhase("success");
    } catch (err) {
      setFailMessage(err instanceof Error ? err.message : "Payment failed");
      setPhase("failed");
    }
  };

  if (listingId && listingPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (plots.length === 0 && phase !== "success") {
    return (
      <EmptyState
        icon={Map}
        title="Nothing to check out"
        description="Select plots on the satellite map first — your picks carry over here."
        action={
          <Button render={<Link href="/map" />}>
            <Map data-icon="inline-start" /> Open the map
          </Button>
        }
      />
    );
  }

  /* ------------------------- phases ------------------------- */

  if (phase === "processing") {
    return (
      <Card className="mx-auto max-w-lg items-center gap-4 rounded-2xl p-10 text-center">
        <LoaderCircle className="size-10 animate-spin text-primary" aria-hidden />
        <h1 className="font-heading text-xl font-bold">Contacting {method === "card" ? "card gateway" : "mobile network"}…</h1>
        <p className="text-sm text-muted-foreground">
          {method === "card"
            ? "Authorising your card."
            : "Approve the prompt on your phone to move funds into escrow."}
        </p>
      </Card>
    );
  }

  if (phase === "success" && result) {
    return (
      <Card className="mx-auto max-w-lg items-center gap-4 rounded-2xl p-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/15">
          <CircleCheck className="size-9 text-success" aria-hidden />
        </span>
        <h1 className="font-heading text-2xl font-bold">Payment locked in escrow 🎉</h1>
        <p className="text-sm text-muted-foreground">
          Receipt <span className="font-mono font-bold">{result.receiptNo}</span> — {result.plots.length} plot
          {result.plots.length > 1 ? "s" : ""} for {formatGHS(result.amount + result.fees)}. The seller only gets paid
          after documents transfer and title handover.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href={`/dashboard/purchase/${result.id}`} />}>
            <ShieldCheck data-icon="inline-start" /> Open escrow tracker
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/dashboard/purchases" />}>
            My purchases
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "failed") {
    return (
      <Card className="mx-auto max-w-lg items-center gap-4 rounded-2xl p-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/15">
          <CircleX className="size-9 text-destructive" aria-hidden />
        </span>
        <h1 className="font-heading text-2xl font-bold">Payment failed</h1>
        <p className="text-sm text-muted-foreground">{failMessage}</p>
        <div className="mt-2 flex gap-3">
          <Button variant="outline" onClick={() => setPhase("review")}>
            <ArrowLeft data-icon="inline-start" /> Review order
          </Button>
          <Button
            onClick={() => {
              setValue("simulateFailure", false);
              setPhase("pay");
            }}
          >
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Escrow-protected purchase · signed in as {user.name}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {phase === "review" ? (
            <Card className="gap-4 rounded-2xl p-6">
              <h2 className="font-heading text-base font-semibold">Your order</h2>
              {listingId && listing && (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{listing.title}</span>
                    <span className="block text-xs text-muted-foreground">{listing.city} · {listing.region}</span>
                  </p>
                  <Label htmlFor="qty" className="text-xs">
                    Plots
                  </Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={listing.plotsAvailable}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(listing.plotsAvailable, +e.target.value || 1)))}
                    className="w-20"
                  />
                </div>
              )}
              <ul className="divide-y rounded-xl border">
                {plots.map((p) => (
                  <li key={p.parcelId} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold">{p.plotNumber}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.estateName} · {formatSqm(p.areaSqm)} ({formatSqft(p.areaSqm)})
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatGHS(p.price)}</p>
                    {!listingId && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${p.plotNumber}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => removePlot(p.parcelId)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="h-11 w-full" onClick={() => setPhase("pay")}>
                Continue to payment <ArrowRight data-icon="inline-end" />
              </Button>
            </Card>
          ) : (
            <form onSubmit={handleSubmit(pay)} noValidate>
              <Card className="gap-5 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-semibold">Payment method</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhase("review")}>
                    <ArrowLeft data-icon="inline-start" /> Back
                  </Button>
                </div>

                <RadioGroup
                  value={method}
                  onValueChange={(v) => setValue("method", v as PaymentMethod)}
                  className="grid gap-3 sm:grid-cols-3"
                  aria-label="Payment method"
                >
                  {METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={cn(
                        "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                        method === m.value ? "border-primary bg-accent" : "hover:bg-muted",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <m.icon className={cn("size-5", method === m.value ? "text-primary" : "text-muted-foreground")} aria-hidden />
                        <RadioGroupItem value={m.value} aria-label={m.label} />
                      </span>
                      <span className="text-sm font-semibold">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.hint}</span>
                    </label>
                  ))}
                </RadioGroup>

                {method !== "card" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="momo-number">
                      {method === "mtn-momo" ? "MTN MoMo number" : "Telecel Cash number"}
                    </Label>
                    <Input
                      id="momo-number"
                      type="tel"
                      placeholder="+233 24 000 0000"
                      aria-invalid={!!errors.momoNumber}
                      {...register("momoNumber")}
                    />
                    {errors.momoNumber && (
                      <p role="alert" className="text-xs font-medium text-destructive">
                        {errors.momoNumber.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You&apos;ll get an approval prompt on this number.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                    <div className="space-y-1.5">
                      <Label htmlFor="card-number">Card number</Label>
                      <Input
                        id="card-number"
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        aria-invalid={!!errors.cardNumber}
                        {...register("cardNumber")}
                      />
                      {errors.cardNumber && (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {errors.cardNumber.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="card-expiry">Expiry</Label>
                      <Input id="card-expiry" placeholder="12/28" aria-invalid={!!errors.cardExpiry} {...register("cardExpiry")} />
                      {errors.cardExpiry && (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {errors.cardExpiry.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="card-cvc">CVC</Label>
                      <Input id="card-cvc" inputMode="numeric" placeholder="123" aria-invalid={!!errors.cardCvc} {...register("cardCvc")} />
                      {errors.cardCvc && (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {errors.cardCvc.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button type="submit" size="lg" className="h-12 w-full">
                  <ShieldCheck data-icon="inline-start" /> Pay {formatGHS(amount + fees)} into escrow
                </Button>
              </Card>
            </form>
          )}
        </div>

        <aside>
          <Card className="sticky top-20 gap-3 rounded-2xl p-6">
            <h2 className="font-heading text-base font-semibold">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plots</dt>
                <dd className="font-medium">{plots.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total land area</dt>
                <dd className="text-right font-medium">
                  {formatSqft(totalSqm)}
                  <span className="block text-xs text-muted-foreground">{formatAcres(totalSqm)}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Land price</dt>
                <dd className="font-medium">{formatGHS(amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Escrow &amp; docs fee (2%)</dt>
                <dd className="font-medium">{formatGHS(fees)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2.5 font-heading text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatGHS(amount + fees)}</dd>
              </div>
            </dl>
            <p className="rounded-lg bg-accent px-3 py-2 text-xs leading-relaxed text-accent-foreground">
              <ShieldCheck className="mr-1 inline size-3.5" aria-hidden />
              Funds are held by RealEstate Escrow and released to the seller only after title handover is confirmed.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
