import { apiFetch } from "@/lib/api-client";
import type {
  Currency,
  CurrencyReference,
  ExchangeRateQuote,
  ExchangeRateSource,
  Paginated,
  Single,
} from "@/types/api";

export interface ExchangeRateListParams {
  search?: string;
  base_currency?: Currency;
  quote_currency?: Currency;
  source?: ExchangeRateSource;
  page?: number;
  per_page?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

/**
 * La parite fixe est absente du type d'entree : elle n'est pas saisissable.
 * Une parite reglementaire n'est pas une cotation, et laisser une saisie
 * humaine la reecrire fausserait tous les rapprochements qui s'y referent.
 */
export type EditableRateSource = Exclude<ExchangeRateSource, "fixed_peg">;

export interface ExchangeRateInput {
  base_currency: Currency;
  quote_currency: Currency;
  rate: number;
  source: EditableRateSource;
  effective_from: string;
}

/** Referentiel des devises : decimales, libelles, devise par defaut et de reference. */
export async function reference(): Promise<CurrencyReference> {
  const response = await apiFetch<Single<CurrencyReference>>("/currencies");

  return response.data;
}

export function listRates(
  params: ExchangeRateListParams = {},
): Promise<Paginated<ExchangeRateQuote>> {
  return apiFetch<Paginated<ExchangeRateQuote>>("/exchange-rates", { query: { ...params } });
}

export async function findRate(id: string): Promise<ExchangeRateQuote> {
  const response = await apiFetch<Single<ExchangeRateQuote>>(`/exchange-rates/${id}`);

  return response.data;
}

export async function createRate(input: ExchangeRateInput): Promise<ExchangeRateQuote> {
  const response = await apiFetch<Single<ExchangeRateQuote>>("/exchange-rates", {
    method: "POST",
    body: input,
  });

  return response.data;
}

/** La paire n'est pas modifiable : seule la cotation l'est. */
export async function updateRate(
  id: string,
  input: Partial<Omit<ExchangeRateInput, "base_currency" | "quote_currency">>,
): Promise<ExchangeRateQuote> {
  const response = await apiFetch<Single<ExchangeRateQuote>>(`/exchange-rates/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data;
}

export function removeRate(id: string): Promise<void> {
  return apiFetch<void>(`/exchange-rates/${id}`, { method: "DELETE" });
}
