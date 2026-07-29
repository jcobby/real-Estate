import type {
  CartItem,
  Material,
  MaterialFilters,
  MaterialInput,
  MaterialOrder,
  MaterialOrderLine,
  PaymentMethod,
  User,
} from "@/types";
import { MATERIALS, getMaterialById } from "@/data/materials";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, one, payload } from "./http";
import { pushNotification } from "./notifications";

/** The full catalog = seeded products + those listed by supplier users. */
function allMaterials(): Material[] {
  return [...getDb().customMaterials, ...MATERIALS];
}

/** Resolve a material id against both the seeded catalog and supplier listings. */
function resolveMaterial(id: string): Material | undefined {
  return getDb().customMaterials.find((m) => m.id === id) ?? getMaterialById(id);
}

export async function getMaterials(filters: MaterialFilters = {}): Promise<Material[]> {
  if (LIVE) {
    return many<Material>(
      await http.get("/v1/materials", {
        q: filters.q,
        category: filters.category,
        region: filters.region,
        sort: filters.sort,
      }),
    );
  }
  await delay();
  let items = allMaterials();
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.supplierName.toLowerCase().includes(q),
    );
  }
  if (filters.category && filters.category !== "all") items = items.filter((m) => m.category === filters.category);
  if (filters.region && filters.region !== "all") items = items.filter((m) => m.region === filters.region);

  switch (filters.sort) {
    case "price-asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      items.sort((a, b) => b.rating - a.rating);
      break;
    case "popular":
    default:
      items.sort((a, b) => Number(b.popular) - Number(a.popular) || b.reviewsCount - a.reviewsCount);
  }
  return items;
}

export async function getMaterial(id: string): Promise<Material | null> {
  if (LIVE) return one<Material>(await http.get(`/v1/materials/${id}`), "material");
  await delay(150);
  return resolveMaterial(id) ?? null;
}

/** Resolve cart items into full materials + line totals. */
export async function getCartDetails(items: CartItem[]): Promise<Array<{ material: Material; qty: number }>> {
  if (LIVE) {
    const resolved = await Promise.all(
      items.map(async (i) => {
        const material = await getMaterial(i.materialId).catch(() => null);
        return material ? { material, qty: i.qty } : null;
      }),
    );
    return resolved.filter((x): x is { material: Material; qty: number } => !!x);
  }
  await delay(120);
  return items
    .map((i) => {
      const material = resolveMaterial(i.materialId);
      return material ? { material, qty: i.qty } : null;
    })
    .filter((x): x is { material: Material; qty: number } => !!x);
}

/* ------------------------------------------------------------------ */
/* supplier product management                                         */
/* ------------------------------------------------------------------ */

export async function getSupplierMaterials(supplierId: string): Promise<Material[]> {
  if (LIVE) return many<Material>(await http.get(`/v1/suppliers/${supplierId}/materials`));
  await delay();
  return getDb()
    .customMaterials.filter((m) => m.supplierId === supplierId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createMaterial(supplier: User, input: MaterialInput): Promise<Material> {
  if (LIVE) return (one<Material>(await http.post("/v1/materials", input), "material")) as Material;
  await delay(500);
  const material: Material = {
    ...input,
    id: uid("mat"),
    supplierId: supplier.id,
    supplierName: supplier.company ?? supplier.name,
    rating: 0,
    reviewsCount: 0,
    popular: false,
  };
  mutateDb((db) => db.customMaterials.unshift(material));
  return material;
}

export async function updateMaterial(id: string, patch: MaterialInput): Promise<Material | null> {
  if (LIVE) return one<Material>(await http.patch(`/v1/materials/${id}`, patch), "material");
  await delay(400);
  let updated: Material | null = null;
  mutateDb((db) => {
    const i = db.customMaterials.findIndex((m) => m.id === id);
    if (i >= 0) {
      db.customMaterials[i] = { ...db.customMaterials[i], ...patch };
      updated = db.customMaterials[i];
    }
  });
  return updated;
}

export async function deleteMaterial(id: string): Promise<void> {
  if (LIVE) {
    await http.del(`/v1/materials/${id}`);
    return;
  }
  await delay(300);
  mutateDb((db) => {
    db.customMaterials = db.customMaterials.filter((m) => m.id !== id);
  });
}

export interface PlaceOrderInput {
  buyerId: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  region: string;
  simulateFailure?: boolean;
}

const DELIVERY_FEE = 150;

export async function placeMaterialOrder(input: PlaceOrderInput): Promise<MaterialOrder> {
  if (LIVE) {
    const created = payload<{ order: MaterialOrder; paymentClientData?: { reference?: string }; reference?: string }>(
      await http.post("/v1/material-orders", {
        lines: input.items.map((i) => ({ materialId: i.materialId, qty: i.qty })),
        deliveryAddress: input.deliveryAddress,
        region: input.region,
        paymentMethod: input.paymentMethod,
      }),
    );
    const reference = created.paymentClientData?.reference ?? created.reference;
    const outcome = input.simulateFailure ? "failed" : "success";
    const done = payload<{ order?: MaterialOrder }>(
      await http.post("/v1/material-orders/sandbox/complete", { reference, outcome }),
    );
    if (input.simulateFailure) {
      throw new Error("Payment declined by provider. No funds were taken — please try again.");
    }
    return (done.order ?? created.order) as MaterialOrder;
  }

  await delay(2200);
  if (input.simulateFailure) {
    throw new Error("Payment declined by provider. No funds were taken — please try again.");
  }
  const lines: MaterialOrderLine[] = input.items
    .map((i) => {
      const m = resolveMaterial(i.materialId);
      return m ? { materialId: m.id, name: m.name, unit: m.unit, price: m.price, qty: i.qty } : null;
    })
    .filter((l): l is MaterialOrderLine => !!l);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const maxDelivery = Math.max(1, ...input.items.map((i) => resolveMaterial(i.materialId)?.deliveryDays ?? 1));

  const order: MaterialOrder = {
    id: uid("ord"),
    orderNo: `MT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`,
    buyerId: input.buyerId,
    lines,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total: subtotal + DELIVERY_FEE,
    paymentMethod: input.paymentMethod,
    status: "confirmed",
    deliveryAddress: input.deliveryAddress,
    region: input.region,
    createdAt: new Date().toISOString(),
    eta: new Date(Date.now() + maxDelivery * 86_400_000).toISOString(),
  };
  mutateDb((db) => db.materialOrders.unshift(order));
  pushNotification({
    userId: input.buyerId,
    type: "system",
    title: "Order confirmed",
    body: `${order.orderNo}: ${lines.length} item(s) for ₵${order.total.toLocaleString()} — arriving by delivery.`,
    href: "/dashboard/orders",
  });
  return order;
}

export async function getMaterialOrders(buyerId: string): Promise<MaterialOrder[]> {
  if (LIVE) return many<MaterialOrder>(await http.get("/v1/material-orders"));
  await delay();
  return getDb()
    .materialOrders.filter((o) => o.buyerId === buyerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const ORDER_FLOW = ["processing", "confirmed", "dispatched", "delivered"] as const;

/** Demo control: nudge an order to its next fulfilment stage. */
export async function advanceMaterialOrder(orderId: string): Promise<MaterialOrder | null> {
  if (LIVE) return one<MaterialOrder>(await http.post(`/v1/material-orders/${orderId}/advance`), "order");
  await delay(700);
  let result: MaterialOrder | null = null;
  mutateDb((db) => {
    const o = db.materialOrders.find((x) => x.id === orderId);
    if (!o) return;
    const idx = ORDER_FLOW.indexOf(o.status);
    if (idx < ORDER_FLOW.length - 1) o.status = ORDER_FLOW[idx + 1];
    result = { ...o };
  });
  return result;
}
