import { apiDownload, apiFetch } from "@/lib/api-client";
import type {
  Currency,
  Invoice,
  InvoiceStatus,
  Paginated,
  PaymentAuthorization,
  Single,
} from "@/types/api";

export interface InvoiceListParams {
  sort?: string;
  direction?: "asc" | "desc";
  search?: string;
  supplier_id?: string;
  purchase_order_id?: string;
  status?: InvoiceStatus;
  currency?: Currency;
  page?: number;
  per_page?: number;
}

export interface InvoiceLineInput {
  purchase_order_line_id: string | null;
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
  purchase_order_id: string;
  currency?: string;
  invoice_date: string;
  due_date?: string | null;
  lines: InvoiceLineInput[];
}

export function list(params: InvoiceListParams = {}): Promise<Paginated<Invoice>> {
  return apiFetch<Paginated<Invoice>>("/invoices", { query: { ...params } });
}

export async function find(id: string): Promise<Invoice> {
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

export async function cancel(id: string): Promise<Invoice> {
  const response = await apiFetch<Single<Invoice>>(`/invoices/${id}/cancel`, { method: "POST" });

  return response.data;
}

/**
 * Change la devise de reglement, ce qui **rejoue le rapprochement**.
 *
 * Les montants des lignes ne sont pas convertis : corriger la devise corrige
 * la facon dont la facture a ete lue, pas ce que le fournisseur a ecrit
 * dessus. La reponse porte deja le nouveau verdict.
 */
export async function changeCurrency(id: string, currency: Currency): Promise<Invoice> {
  const response = await apiFetch<Single<Invoice>>(`/invoices/${id}/currency`, {
    method: "PATCH",
    body: { currency },
  });

  return response.data;
}

/**
 * Telecharge la facture au format PDF, verdict de rapprochement compris — une
 * facture imprimee sans son controle ne dit pas si elle est payable.
 */
export function downloadPdf(id: string, reference: string): Promise<void> {
  return apiDownload(`/invoices/${id}/pdf`, `facture-${reference}.pdf`);
}

export async function paymentAuthorization(id: string): Promise<PaymentAuthorization | null> {
  const response = await apiFetch<{ data: PaymentAuthorization | null }>(
    `/invoices/${id}/payment-authorization`,
  );

  return response.data;
}
