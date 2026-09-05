import { apiFetch } from "@/lib/api-client";
import type {
  DiscrepancySeverity,
  DiscrepancyType,
  MatchException,
  MatchRun,
  Paginated,
  ReviewStatus,
  Single,
} from "@/types/api";

export interface MatchRunListParams {
  page?: number;
  per_page?: number;
}

export interface ExceptionListParams {
  sort?: string;
  direction?: "asc" | "desc";
  review_status?: ReviewStatus;
  type?: DiscrepancyType;
  severity?: DiscrepancySeverity;
  invoice_id?: number;
  supplier_id?: number;
  page?: number;
  per_page?: number;
}

export interface ReviewResult {
  exception: MatchException;
  /** null lors d'un refus : le circuit automatique s'arrete la. */
  match_run: MatchRun | null;
}

export function listRuns(
  invoiceId: number,
  params: MatchRunListParams = {},
): Promise<Paginated<MatchRun>> {
  return apiFetch<Paginated<MatchRun>>(`/invoices/${invoiceId}/match-runs`, {
    query: { ...params },
  });
}

export async function findRun(invoiceId: number, matchRunId: number): Promise<MatchRun> {
  const response = await apiFetch<Single<MatchRun>>(
    `/invoices/${invoiceId}/match-runs/${matchRunId}`,
  );

  return response.data;
}

/** Rejoue le rapprochement ; l'utilisateur courant devient l'auteur de la decision. */
export async function runMatching(invoiceId: number): Promise<MatchRun> {
  const response = await apiFetch<Single<MatchRun>>(`/invoices/${invoiceId}/match-runs`, {
    method: "POST",
  });

  return response.data;
}

export function listExceptions(params: ExceptionListParams = {}): Promise<Paginated<MatchException>> {
  return apiFetch<Paginated<MatchException>>("/match-exceptions", { query: { ...params } });
}

export async function findException(id: number): Promise<MatchException> {
  const response = await apiFetch<Single<MatchException>>(`/match-exceptions/${id}`);

  return response.data;
}

/**
 * Arbitrage d'un ecart. Le motif est obligatoire cote backend : un arbitrage
 * sans justification serait intracable a posteriori.
 */
export async function reviewException(
  id: number,
  decision: Extract<ReviewStatus, "approved" | "rejected">,
  note: string,
): Promise<ReviewResult> {
  const response = await apiFetch<Single<ReviewResult>>(`/match-exceptions/${id}/review`, {
    method: "POST",
    body: { decision, note },
  });

  return response.data;
}
