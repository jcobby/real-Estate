"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { MATERIAL_CATEGORIES } from "@/data/materials";
import type { Material, MaterialCategory, MaterialInput } from "@/types";

const REGIONS = ["Greater Accra", "Ashanti", "Eastern", "Northern", "Central", "Volta", "Western", "Upper West"];

const schema = z.object({
  name: z.string().min(4, "Give the product a clear name"),
  category: z.string().min(1, "Choose a category"),
  brand: z.string().min(2, "Enter a brand or maker"),
  price: z.number().min(0.1, "Enter a price in ₵"),
  unit: z.string().min(1, "e.g. bag, piece, 12m length"),
  region: z.string().min(1, "Choose your region"),
  deliveryDays: z.number().int().min(1, "At least 1 day").max(30, "Max 30 days"),
  inStock: z.boolean(),
  description: z.string().min(20, "Describe the product in a sentence or two"),
});

type FormValues = z.infer<typeof schema>;

function toDefaults(material?: Material): FormValues {
  return {
    name: material?.name ?? "",
    category: material?.category ?? "cement",
    brand: material?.brand ?? "",
    price: material?.price ?? 0,
    unit: material?.unit ?? "",
    region: material?.region ?? "Greater Accra",
    deliveryDays: material?.deliveryDays ?? 2,
    inStock: material?.inStock ?? true,
    description: material?.description ?? "",
  };
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
  onSubmit: (input: MaterialInput) => void;
  saving: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(material) });

  useEffect(() => {
    if (open) reset(toDefaults(material));
  }, [open, material, reset]);

  const values = watch();

  const submit = (v: FormValues) => onSubmit({ ...v, category: v.category as MaterialCategory });
  const err = (k: keyof FormValues) =>
    errors[k] && <p className="text-xs font-medium text-destructive">{errors[k]?.message as string}</p>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? "Edit product" : "List a new product"}</DialogTitle>
          <DialogDescription>
            It appears in the public materials shop under your supplier name.
          </DialogDescription>
        </DialogHeader>

        <form id="material-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Product name</Label>
            <Input id="m-name" placeholder="e.g. Precast concrete fence post" aria-invalid={!!errors.name} {...register("name")} />
            {err("name")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-category">Category</Label>
              <Select
                items={MATERIAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                value={values.category}
                onValueChange={(v) => setValue("category", v as string, { shouldValidate: true })}
              >
                <SelectTrigger id="m-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-brand">Brand / maker</Label>
              <Input id="m-brand" placeholder="e.g. Adom Precast" aria-invalid={!!errors.brand} {...register("brand")} />
              {err("brand")}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-price">Price (₵)</Label>
              <Input id="m-price" type="number" step="0.1" min={0} aria-invalid={!!errors.price} {...register("price", { valueAsNumber: true })} />
              {err("price")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-unit">Unit</Label>
              <Input id="m-unit" placeholder="bag, piece, 12m length" aria-invalid={!!errors.unit} {...register("unit")} />
              {err("unit")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-delivery">Delivery (days)</Label>
              <Input id="m-delivery" type="number" min={1} max={30} aria-invalid={!!errors.deliveryDays} {...register("deliveryDays", { valueAsNumber: true })} />
              {err("deliveryDays")}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-region">Region</Label>
            <Select
              items={REGIONS.map((r) => ({ value: r, label: r }))}
              value={values.region}
              onValueChange={(v) => setValue("region", v as string, { shouldValidate: true })}
            >
              <SelectTrigger id="m-region" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-desc">Description</Label>
            <Textarea id="m-desc" rows={3} placeholder="What is it, and what's it good for?" aria-invalid={!!errors.description} {...register("description")} />
            {err("description")}
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3.5">
            <div>
              <p className="text-sm font-medium">In stock</p>
              <p className="text-xs text-muted-foreground">Buyers can only order products that are in stock.</p>
            </div>
            <Switch checked={values.inStock} onCheckedChange={(v) => setValue("inStock", v)} aria-label="In stock" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="material-form" disabled={saving}>
            {saving && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
            {material ? "Save changes" : "Publish product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
