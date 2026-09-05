import { apiFetch } from "@/lib/api-client";
import type { AuditFacets, AuditLog, Paginated, Single } from "@/types/api";

export interface AuditListParams {
  search?: string;
  event?: string;
  subject_type?: string;
  subject_id?: string;
  causer_id?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

/**
 * Journal d'audit — lecture seule.
 *
 * Aucune fonction d'ecriture n'existe, et ce n'est pas un oubli : la trace se
 * constitue au fil des ecritures metier. Pouvoir en ajouter une a la main
 * viderait le journal de sa valeur probante.
 */
export function list(params: AuditListParams = {}): Promise<Paginated<AuditLog>> {
  return apiFetch<Paginated<AuditLog>>("/audit-logs", { query: { ...params } });
}

export async function find(id: string): Promise<AuditLog> {
  const response = await apiFetch<Single<AuditLog>>(`/audit-logs/${id}`);

  return response.data;
}

/** Valeurs de filtre calculees sur les donnees reelles, pas codees en dur. */
export async function facets(): Promise<AuditFacets> {
  const response = await apiFetch<Single<AuditFacets>>("/audit-logs/facets");

  return response.data;
}
