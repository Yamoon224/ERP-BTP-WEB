import { apiFetch } from "@/lib/api-client";
import type {
  Paginated,
  PaymentAuthorization,
  PaymentAuthorizationStatus,
  PaymentMethod,
  Single,
} from "@/types/api";

export interface PaymentListParams {
  invoice_id?: string;
  supplier_id?: string;
  status?: PaymentAuthorizationStatus;
  /** Absent : tout ; `true` : deja regle ; `false` : reste a regler. */
  settled?: boolean;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface SettlementInput {
  payment_reference: string;
  payment_method?: PaymentMethod | null;
  settled_at?: string | null;
}

export function listAuthorizations(
  params: PaymentListParams = {},
): Promise<Paginated<PaymentAuthorization>> {
  return apiFetch<Paginated<PaymentAuthorization>>("/payment-authorizations", {
    query: { ...params },
  });
}

/**
 * Constate le reglement d'une autorisation.
 *
 * Aucun montant n'est envoye — le backend le refuserait de toute facon : celui
 * qui est regle est celui qu'a calcule le moteur. C'est ce qui empeche cet
 * ecran de devenir un moyen de payer ce que le rapprochement a bloque.
 */
export async function settle(
  authorizationId: string,
  input: SettlementInput,
): Promise<PaymentAuthorization> {
  const response = await apiFetch<Single<PaymentAuthorization>>(
    `/payment-authorizations/${authorizationId}/settle`,
    { method: "POST", body: input },
  );

  return response.data;
}
