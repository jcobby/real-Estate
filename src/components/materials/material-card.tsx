"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_META, materialImageSrc } from "./category-meta";
import { CATEGORY_LABEL } from "@/data/materials";
import { useCart } from "@/stores/cart";
import { formatGHS } from "@/lib/format";
import type { Material } from "@/types";
import { cn } from "@/lib/utils";

/** Product-shot tile — the material's photo (or its category image), brand-tagged. */
export function MaterialTile({ material, className }: { material: Material; className?: string }) {
  const meta = CATEGORY_META[material.category];
  const Icon = meta.icon;
  const [broken, setBroken] = useState(false);
  const src = materialImageSrc(material);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
    >
      {broken ? (
        <span className="flex size-full items-center justify-center">
          <Icon className="size-14 opacity-90" style={{ color: meta.fg }} strokeWidth={1.5} aria-hidden />
        </span>
      ) : (
        <Image
          src={src}
          alt={material.name}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover"
          onError={() => setBroken(true)}
        />
      )}
      <span className="absolute right-2 bottom-2 rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-bold text-neutral-700 backdrop-blur-sm">
        {material.brand}
      </span>
    </div>
  );
}

export function MaterialCard({ material }: { material: Material }) {
  const qty = useCart((s) => s.items.find((i) => i.materialId === material.id)?.qty ?? 0);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);

  return (
    <Card className="group gap-0 overflow-hidden rounded-2xl p-0 transition-shadow hover:shadow-lg">
      <div className="relative">
        <MaterialTile material={material} className="aspect-[5/3] w-full" />
        {material.popular && (
          <Badge className="absolute top-2.5 left-2.5 bg-primary text-primary-foreground">Popular</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {CATEGORY_LABEL[material.category]}
        </p>
        <h3 className="line-clamp-2 min-h-10 text-sm leading-snug font-semibold">{material.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Star className="size-3.5 fill-primary text-primary" aria-hidden /> {material.rating.toFixed(1)}
          </span>
          <span>·</span>
          <span className="truncate">{material.supplierName}</span>
        </div>

        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="font-heading text-lg font-bold">
            {formatGHS(material.price)}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/ {material.unit}</span>
          </p>
          {material.inStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
              <Check className="size-3.5" aria-hidden /> In stock
            </span>
          ) : (
            <span className="text-[11px] font-medium text-muted-foreground">Out of stock</span>
          )}
        </div>

        <div className="mt-2">
          {qty === 0 ? (
            <Button
              className="w-full"
              onClick={() => {
                add(material.id);
                toast.success("Added to cart", { description: material.name });
              }}
            >
              <ShoppingCart data-icon="inline-start" /> Add to cart
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-1">
              <Button variant="ghost" size="icon-sm" aria-label="Decrease quantity" onClick={() => setQty(material.id, qty - 1)}>
                <Minus />
              </Button>
              <span className="text-sm font-semibold" aria-live="polite">
                {qty} <span className="text-xs font-normal text-muted-foreground">in cart</span>
              </span>
              <Button variant="ghost" size="icon-sm" aria-label="Increase quantity" onClick={() => setQty(material.id, qty + 1)}>
                <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function MaterialCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl p-0">
      <div className="aspect-[5/3] w-full animate-pulse bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
