import { apiFetch } from "@/lib/api-client";
import type { Paginated, PurchaseOrder, PurchaseOrderStatus, Single } from "@/types/api";

export interface PurchaseOrderListParams {
  sort?: string;
  direction?: "asc" | "desc";
  search?: string;
  supplier_id?: number;
  project_id?: number;
  status?: PurchaseOrderStatus;
  page?: number;
  per_page?: number;
}

export interface PurchaseOrderLineInput {
  item_code: string;
  description: string;
  unit: string;
  quantity_ordered: number;
  unit_price: number;
}

export interface PurchaseOrderInput {
  reference: string;
  supplier_id: number;
  project_id: number;
  currency?: string;
  ordered_at: string;
  notes?: string | null;
  lines: PurchaseOrderLineInput[];
}

export function list(params: PurchaseOrderListParams = {}): Promise<Paginated<PurchaseOrder>> {
  return apiFetch<Paginated<PurchaseOrder>>("/purchase-orders", { query: { ...params } });
}

export async function find(id: number): Promise<PurchaseOrder> {
  const response = await apiFetch<Single<PurchaseOrder>>(`/purchase-orders/${id}`);

  return response.data;
}

export async function create(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  const response = await apiFetch<Single<PurchaseOrder>>("/purchase-orders", {
    method: "POST",
    body: input,
  });

  return response.data;
}
