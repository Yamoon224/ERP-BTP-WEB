/**
 * Devises supportees par le circuit achats.
 *
 * Le nombre de decimales n'est pas cosmetique : le franc CFA n'a pas de
 * sous-unite. Afficher « 3 960 000,00 F CFA » serait faux — ces centimes
 * n'existent pas. `Intl.NumberFormat` connait cette regle pour XOF, mais les
 * calculs et les saisies doivent la respecter aussi.
 */
export const CURRENCIES = ["EUR", "USD", "XOF"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  EUR: 2,
  USD: 2,
  // Pas de centime de franc CFA.
  XOF: 0,
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  EUR: "Euro",
  USD: "Dollar americain",
  XOF: "Franc CFA (BCEAO)",
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** Nombre de decimales d'une devise, avec repli prudent sur deux. */
export function currencyDecimals(currency: string): number {
  return isCurrency(currency) ? CURRENCY_DECIMALS[currency] : 2;
}
