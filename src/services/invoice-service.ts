import { apiFetch } from "@/lib/api-client";
import type { Invoice, InvoiceStatus, Paginated, PaymentAuthorization, Single } from "@/types/api";

export interface InvoiceListParams {
  sort?: string;
  direction?: "asc" | "desc";
  search?: string;
  supplier_id?: number;
  purchase_order_id?: number;
  status?: InvoiceStatus;
  page?: number;
  per_page?: number;
}

export interface InvoiceLineInput {
  purchase_order_line_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
}

/**
 * Ni `supplier_id` ni `total_amount` : le backend les refuse en entree, le
 * fournisseur venant du bon de commande et le total etant recalcule depuis les
 * lignes. Le type le rend impossible a envoyer par erreur.
 */
export interface InvoiceInput {
  reference: string;
  purchase_order_id: number;
  currency?: string;
  invoice_date: string;
  due_date?: string | null;
  lines: InvoiceLineInput[];
}

export function list(params: InvoiceListParams = {}): Promise<Paginated<Invoice>> {
  return apiFetch<Paginated<Invoice>>("/invoices", { query: { ...params } });
}

export async function find(id: number): Promise<Invoice> {
  const response = await apiFetch<Single<Invoice>>(`/invoices/${id}`);

  return response.data;
}

/** Soumettre une facture declenche immediatement son rapprochement. */
export async function submit(input: InvoiceInput): Promise<Invoice> {
  const response = await apiFetch<Single<Invoice>>("/invoices", {
    method: "POST",
    body: input,
  });

  return response.data;
}

export async function cancel(id: number): Promise<Invoice> {
  const response = await apiFetch<Single<Invoice>>(`/invoices/${id}/cancel`, { method: "POST" });

  return response.data;
}

export async function paymentAuthorization(id: number): Promise<PaymentAuthorization | null> {
  const response = await apiFetch<{ data: PaymentAuthorization | null }>(
    `/invoices/${id}/payment-authorization`,
  );

  return response.data;
}
