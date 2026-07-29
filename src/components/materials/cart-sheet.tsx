"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { MaterialTile } from "./material-card";
import { getCartDetails } from "@/lib/api";
import { useCart } from "@/stores/cart";
import { useSession } from "@/stores/session";
import { formatGHS } from "@/lib/format";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const items = useCart((s) => s.items);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="relative" aria-label={`Cart (${count} items)`} />}>
        <ShoppingCart />
        {count > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]">{count}</Badge>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <CartContents onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function CartContents({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { session } = useSession();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const { data: details = [], isPending } = useQuery({
    queryKey: ["cart-details", items],
    queryFn: () => getCartDetails(items),
    enabled: items.length > 0,
  });

  const subtotal = details.reduce((s, d) => s + d.material.price * d.qty, 0);

  const checkout = () => {
    onClose();
    if (!session) {
      toast("Sign in to check out", { description: "Your cart is saved — sign in and complete your order." });
      router.push("/login?next=/materials/checkout");
      return;
    }
    router.push("/materials/checkout");
  };

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" aria-hidden /> Your cart
          {items.length > 0 && <span className="text-sm font-normal text-muted-foreground">({items.length})</span>}
        </SheetTitle>
      </SheetHeader>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add cement, blocks, roofing, tools and more to build on your land."
            action={
              <Button onClick={onClose} render={<Link href="/materials" />}>
                Browse materials
              </Button>
            }
            className="border-none bg-transparent"
          />
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <ul className="divide-y">
              {isPending
                ? items.map((i) => <li key={i.materialId} className="h-24 animate-pulse bg-muted/40" />)
                : details.map(({ material, qty }) => (
                    <li key={material.id} className="flex gap-3 p-4">
                      <MaterialTile material={material} className="size-16 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold">{material.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatGHS(material.price)} / {material.unit}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex items-center rounded-md border">
                            <Button variant="ghost" size="icon-xs" aria-label="Decrease" onClick={() => setQty(material.id, qty - 1)}>
                              <Minus />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                            <Button variant="ghost" size="icon-xs" aria-label="Increase" onClick={() => setQty(material.id, qty + 1)}>
                              <Plus />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove ${material.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => remove(material.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-bold">{formatGHS(material.price * qty)}</p>
                    </li>
                  ))}
            </ul>
          </ScrollArea>

          <div className="space-y-3 border-t p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-heading text-lg font-bold">{formatGHS(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Delivery calculated at checkout.</p>
            <Button size="lg" className="h-11 w-full" onClick={checkout} disabled={isPending}>
              Checkout · {formatGHS(subtotal)}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
