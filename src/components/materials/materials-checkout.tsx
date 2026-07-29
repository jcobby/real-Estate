"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  CreditCard,
  LoaderCircle,
  PackageCheck,
  ShoppingCart,
  Smartphone,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MaterialTile } from "./material-card";
import { getCartDetails, placeMaterialOrder } from "@/lib/api";
import { useCart } from "@/stores/cart";
import { useSession } from "@/stores/session";
import { formatGHS } from "@/lib/format";
import type { MaterialOrder, PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";

const REGIONS = ["Greater Accra", "Ashanti", "Eastern", "Northern", "Central", "Volta", "Western", "Upper West"];
const DELIVERY_FEE = 150;

const schema = z
  .object({
    region: z.string().min(1, "Choose your region"),
    address: z.string().min(8, "Enter a delivery address / landmark"),
    method: z.enum(["mtn-momo", "vodafone-cash", "card"]),
    momoNumber: z.string().optional(),
    cardNumber: z.string().optional(),
    simulateFailure: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.method !== "card") {
      if (!v.momoNumber || !/^\+?[\d\s]{9,15}$/.test(v.momoNumber)) {
        ctx.addIssue({ code: "custom", path: ["momoNumber"], message: "Enter a valid mobile-money number" });
      }
    } else if (!v.cardNumber || v.cardNumber.replace(/\s/g, "").length < 12) {
      ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Enter a valid card number" });
    }
  });

type FormValues = z.infer<typeof schema>;

const METHODS: Array<{ value: PaymentMethod; label: string; hint: string; icon: typeof Smartphone }> = [
  { value: "mtn-momo", label: "MTN MoMo", hint: "Instant wallet debit", icon: Smartphone },
  { value: "vodafone-cash", label: "Telecel Cash", hint: "Wallet transfer", icon: Smartphone },
  { value: "card", label: "Card", hint: "Visa, Mastercard & more", icon: CreditCard },
];

type Phase = "form" | "processing" | "success" | "failed";

export function MaterialsCheckout() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const user = session!.user;
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<MaterialOrder | null>(null);
  const [failMessage, setFailMessage] = useState("");

  const { data: details = [], isPending } = useQuery({
    queryKey: ["cart-details", items],
    queryFn: () => getCartDetails(items),
    enabled: items.length > 0,
  });

  const subtotal = details.reduce((s, d) => s + d.material.price * d.qty, 0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { region: user.region || "", method: "mtn-momo", momoNumber: user.phone, simulateFailure: false },
  });
  const method = watch("method");

  const submit = async (v: FormValues) => {
    setPhase("processing");
    try {
      const order = await placeMaterialOrder({
        buyerId: user.id,
        items,
        paymentMethod: v.method,
        deliveryAddress: v.address,
        region: v.region,
        simulateFailure: v.simulateFailure,
      });
      clear();
      queryClient.invalidateQueries({ queryKey: ["material-orders", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      setResult(order);
      setPhase("success");
    } catch (err) {
      setFailMessage(err instanceof Error ? err.message : "Payment failed");
      setPhase("failed");
    }
  };

  if (items.length === 0 && phase !== "success") {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Add some materials before checking out."
        action={
          <Button render={<Link href="/materials" />}>
            Browse materials
          </Button>
        }
      />
    );
  }

  if (phase === "processing") {
    return (
      <Card className="mx-auto max-w-lg items-center gap-4 rounded-2xl p-10 text-center">
        <LoaderCircle className="size-10 animate-spin text-primary" aria-hidden />
        <h1 className="font-heading text-xl font-bold">Processing payment…</h1>
        <p className="text-sm text-muted-foreground">Approve the prompt to confirm your order.</p>
      </Card>
    );
  }

  if (phase === "success" && result) {
    return (
      <Card className="mx-auto max-w-lg items-center gap-4 rounded-2xl p-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/15">
          <CircleCheck className="size-9 text-success" aria-hidden />
        </span>
        <h1 className="font-heading text-2xl font-bold">Order confirmed 🎉</h1>
        <p className="text-sm text-muted-foreground">
          Receipt <span className="font-mono font-bold">{result.orderNo}</span> — {result.lines.length} item(s) for{" "}
          {formatGHS(result.total)}. We&apos;ll deliver to {result.region}.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href="/dashboard/orders" />}>
            <PackageCheck data-icon="inline-start" /> Track my order
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/materials" />}>
            Keep shopping
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
        <Button
          className="mt-2"
          onClick={() => {
            setValue("simulateFailure", false);
            setPhase("form");
          }}
        >
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" render={<Link href="/materials" />}>
        <ArrowLeft data-icon="inline-start" /> Back to shop
      </Button>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Delivery &amp; payment · signed in as {user.name}</p>

      <form onSubmit={handleSubmit(submit)} noValidate className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="gap-4 rounded-2xl p-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <Truck className="size-4.5 text-primary" aria-hidden /> Delivery details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="co-region">Region</Label>
                <Select
                  items={REGIONS.map((r) => ({ value: r, label: r }))}
                  value={watch("region") || null}
                  onValueChange={(v) => setValue("region", (v as string) ?? "", { shouldValidate: true })}
                >
                  <SelectTrigger id="co-region" className="w-full" aria-invalid={!!errors.region}>
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
                {errors.region && <p className="text-xs font-medium text-destructive">{errors.region.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-address">Delivery address / landmark</Label>
              <Textarea id="co-address" rows={2} placeholder="e.g. Plot 14, Oyibi Hillcrest, near the estate gate" aria-invalid={!!errors.address} {...register("address")} />
              {errors.address && <p className="text-xs font-medium text-destructive">{errors.address.message}</p>}
            </div>
          </Card>

          <Card className="gap-5 rounded-2xl p-6">
            <h2 className="font-heading text-base font-semibold">Payment method</h2>
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
                <Label htmlFor="co-momo">Mobile-money number</Label>
                <Input id="co-momo" type="tel" placeholder="+233 24 000 0000" aria-invalid={!!errors.momoNumber} {...register("momoNumber")} />
                {errors.momoNumber && <p className="text-xs font-medium text-destructive">{errors.momoNumber.message}</p>}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="co-card">Card number</Label>
                <Input id="co-card" inputMode="numeric" placeholder="4242 4242 4242 4242" aria-invalid={!!errors.cardNumber} {...register("cardNumber")} />
                {errors.cardNumber && <p className="text-xs font-medium text-destructive">{errors.cardNumber.message}</p>}
              </div>
            )}
          </Card>
        </div>

        <aside>
          <Card className="sticky top-20 gap-3 rounded-2xl p-6">
            <h2 className="font-heading text-base font-semibold">Order summary</h2>
            {isPending ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (
              <ul className="space-y-2.5">
                {details.map(({ material, qty }) => (
                  <li key={material.id} className="flex items-center gap-2.5">
                    <MaterialTile material={material} className="size-10 shrink-0 rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-xs font-medium">{material.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {qty} × {formatGHS(material.price)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold">{formatGHS(material.price * qty)}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatGHS(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">{formatGHS(DELIVERY_FEE)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-heading text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatGHS(subtotal + DELIVERY_FEE)}</dd>
              </div>
            </dl>
            <Button type="submit" size="lg" className="h-12 w-full" disabled={isPending || items.length === 0}>
              Pay {formatGHS(subtotal + DELIVERY_FEE)}
            </Button>
          </Card>
        </aside>
      </form>
    </div>
  );
}
