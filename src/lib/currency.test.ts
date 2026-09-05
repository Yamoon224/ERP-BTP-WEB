import { describe, expect, it } from "vitest";
import { CURRENCIES, currencyDecimals, isCurrency } from "./currency";
import { formatExchangeRate, formatMoney, formatUnitPrice } from "./format";
import { normaliseSpaces } from "@/test/intl";

describe("currencyDecimals", () => {
  it("donne deux décimales à l'euro et au dollar", () => {
    expect(currencyDecimals("EUR")).toBe(2);
    expect(currencyDecimals("USD")).toBe(2);
  });

  it("n'en donne aucune au franc CFA, qui n'a pas de sous-unité", () => {
    expect(currencyDecimals("XOF")).toBe(0);
  });

  it("retombe prudemment sur deux décimales pour une devise inconnue", () => {
    expect(currencyDecimals("GBP")).toBe(2);
  });
});

describe("isCurrency", () => {
  it("reconnaît les trois devises supportées", () => {
    expect(CURRENCIES).toEqual(["EUR", "USD", "XOF"]);
    expect(isCurrency("XOF")).toBe(true);
    expect(isCurrency("JPY")).toBe(false);
  });
});

describe("formatMoney selon la devise", () => {
  it("affiche deux décimales en euro", () => {
    expect(normaliseSpaces(formatMoney(1234.5, "EUR"))).toBe("1 234,50 €");
  });

  it("affiche deux décimales en dollar", () => {
    expect(normaliseSpaces(formatMoney(1085, "USD"))).toContain("1 085,00");
  });

  it("n'affiche aucune décimale en franc CFA", () => {
    // « 3 960 000,00 F CFA » serait faux : ces centimes n'existent pas.
    const formatted = normaliseSpaces(formatMoney(3960000, "XOF"));

    expect(formatted).toContain("3 960 000");
    expect(formatted).not.toContain(",00");
  });

  it("arrondit au franc entier un montant en XOF", () => {
    expect(normaliseSpaces(formatMoney(1234.56, "XOF"))).toContain("1 235");
  });
});

describe("formatUnitPrice", () => {
  it("autorise plus de décimales qu'un montant, même en euro", () => {
    expect(normaliseSpaces(formatUnitPrice(8.9125, "EUR"))).toContain("8,9125");
  });

  it("reste sans décimale en franc CFA quand le prix est entier", () => {
    expect(normaliseSpaces(formatUnitPrice(22000, "XOF"))).toContain("22 000");
  });
});

describe("formatExchangeRate", () => {
  it("garde assez de décimales pour refaire le calcul à la main", () => {
    // La parité du franc CFA est 655,957 : l'arrondir à 655,96 rendrait le
    // montant converti invérifiable.
    expect(normaliseSpaces(formatExchangeRate(655.957))).toBe("655,957");
  });

  it("affiche au moins deux décimales", () => {
    expect(normaliseSpaces(formatExchangeRate(1.085))).toBe("1,085");
    expect(normaliseSpaces(formatExchangeRate(2))).toBe("2,00");
  });
});
