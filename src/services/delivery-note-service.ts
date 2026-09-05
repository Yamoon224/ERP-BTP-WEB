import { apiFetch } from "@/lib/api-client";
import type { DeliveryNote, DeliveryNoteStatus, Paginated, Single } from "@/types/api";

export interface DeliveryNoteListParams {
  sort?: string;
  direction?: "asc" | "desc";
  search?: string;
  purchase_order_id?: string;
  supplier_id?: string;
  status?: DeliveryNoteStatus;
  page?: number;
  per_page?: number;
}

export interface DeliveryNoteInput {
  reference: string;
  purchase_order_id: string;
  received_at: string;
  notes?: string | null;
  lines: Array<{ purchase_order_line_id: string; quantity_received: number }>;
}

export function list(params: DeliveryNoteListParams = {}): Promise<Paginated<DeliveryNote>> {
  return apiFetch<Paginated<DeliveryNote>>("/delivery-notes", { query: { ...params } });
}

export async function find(id: string): Promise<DeliveryNote> {
  const response = await apiFetch<Single<DeliveryNote>>(`/delivery-notes/${id}`);

  return response.data;
}

export async function create(input: DeliveryNoteInput): Promise<DeliveryNote> {
  const response = await apiFetch<Single<DeliveryNote>>("/delivery-notes", {
    method: "POST",
    body: input,
  });

  return response.data;
}

/**
 * Controle de reception. Accepter declenche cote backend le rapprochement de
 * toutes les factures du meme bon de commande : les ecrans qui affichent des
 * factures doivent donc etre rafraichis apres cet appel.
 */
export async function review(
  id: string,
  status: Extract<DeliveryNoteStatus, "accepted" | "rejected">,
): Promise<DeliveryNote> {
  const response = await apiFetch<Single<DeliveryNote>>(`/delivery-notes/${id}/review`, {
    method: "POST",
    body: { status },
  });

  return response.data;
}
