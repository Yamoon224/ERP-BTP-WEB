/**
 * Formatage des valeurs métier.
 *
 * Centralisé pour une raison précise : un montant affiché avec une décimale
 * ici et trois là, sur un écran de contrôle financier, fait douter des
 * chiffres eux-mêmes. Une seule définition, appliquée partout.
 */

import { currencyDecimals } from "./currency";

const LOCALE = "fr-FR";

/**
 * Montant monetaire, a la precision reelle de sa devise.
 *
 * Le nombre de decimales est derive de la devise et non fige a deux : afficher
 * un montant en francs CFA avec des centimes inventerait une precision qui
 * n'existe pas, et ferait douter de tous les autres chiffres de l'ecran.
 */
export function formatMoney(amount: number, currency = "EUR"): string {
  const decimals = currencyDecimals(currency);

  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Quantités : jusqu'à trois décimales, mais sans zéros inutiles — le BTP
 * compte en tonnes et en m³ autant qu'en unités, et « 400 sacs » se lit mieux
 * que « 400,000 sacs ».
 */
export function formatQuantity(quantity: number, unit?: string): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(quantity);

  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Prix unitaire : plus fin qu'un montant, car un prix au kilo peut porter
 * plusieurs decimales significatives meme dans une devise qui n'en a que deux.
 */
export function formatUnitPrice(price: number, currency = "EUR"): string {
  const decimals = currencyDecimals(currency);

  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 4),
  }).format(price);
}

/**
 * Taux de change. Affiche assez de decimales pour etre verifiable a la main :
 * un taux arrondi a deux decimales ne permettrait pas de refaire le calcul.
 */
export function formatExchangeRate(rate: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(rate);
}

/** Ratio d'écart en pourcentage signé (0.2 → « +20 % »). */
export function formatVariance(ratio: number): string {
  const percent = new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(ratio);

  return percent;
}

export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(ratio);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
