"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { MaterialTile } from "@/components/materials/material-card";
import { CATEGORY_LABEL } from "@/data/materials";
import { MaterialFormDialog } from "@/components/seller/material-form-dialog";
import { createMaterial, deleteMaterial, getSupplierMaterials, updateMaterial } from "@/lib/api";
import { useSession } from "@/stores/session";
import { formatGHS } from "@/lib/format";
import type { Material, MaterialInput } from "@/types";

export default function SellerMaterialsPage() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Material | undefined>();
  const [deleting, setDeleting] = useState<Material | null>(null);

  const { data: materials, isPending } = useQuery({
    queryKey: ["supplier-materials", user.id],
    queryFn: () => getSupplierMaterials(user.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-materials", user.id] });
    queryClient.invalidateQueries({ queryKey: ["materials"] });
  };

  const save = useMutation({
    mutationFn: (input: MaterialInput) =>
      editing ? updateMaterial(editing.id, input) : createMaterial(user, input),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      toast.success(editing ? "Product updated" : "Product published to the shop");
      setEditing(undefined);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMaterial(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success("Product removed");
    },
  });

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (m: Material) => {
    setEditing(m);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Materials I supply</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            List building materials &amp; tools — they appear in the public shop for buyers.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus data-icon="inline-start" /> List a product
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : !materials || materials.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products listed yet"
            description="Add cement, blocks, roofing, tools — anything builders need. Buyers order and you get paid on delivery."
            action={
              <Button onClick={openNew}>
                <Plus data-icon="inline-start" /> List your first product
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <MaterialTile material={m} className="h-10 w-14 shrink-0 rounded-lg" />
                        <div className="min-w-0">
                          <p className="line-clamp-1 max-w-64 text-sm font-semibold">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.brand}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{CATEGORY_LABEL[m.category]}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatGHS(m.price)}
                      <span className="block text-xs font-normal text-muted-foreground">/ {m.unit}</span>
                    </TableCell>
                    <TableCell>
                      {m.inStock ? (
                        <Badge className="bg-success text-success-foreground">In stock</Badge>
                      ) : (
                        <Badge variant="outline">Out of stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`View ${m.name} in shop`} render={<Link href={`/materials?q=${encodeURIComponent(m.name)}`} />}>
                          <ExternalLink />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${m.name}`} onClick={() => openEdit(m)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${m.name}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(m)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <MaterialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        material={editing}
        saving={save.isPending}
        onSubmit={(input) => save.mutate(input)}
      />

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this product?</DialogTitle>
            <DialogDescription>&ldquo;{deleting?.name}&rdquo; will be taken off the shop.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>
              {remove.isPending ? "Removing…" : "Remove product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
