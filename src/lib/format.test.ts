import { describe, expect, it } from "vitest";
import { normaliseSpaces } from "@/test/intl";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  formatQuantity,
  formatUnitPrice,
  formatVariance,
} from "./format";

describe("formatMoney", () => {
  it("affiche toujours deux décimales", () => {
    expect(normaliseSpaces(formatMoney(1000))).toBe("1 000,00 €");
    expect(normaliseSpaces(formatMoney(1234.5))).toBe("1 234,50 €");
  });

  it("respecte la devise du document", () => {
    expect(normaliseSpaces(formatMoney(50, "USD"))).toContain("50,00");
  });

  it("gère zéro et les montants négatifs", () => {
    expect(normaliseSpaces(formatMoney(0))).toBe("0,00 €");
    expect(normaliseSpaces(formatMoney(-42.5))).toContain("42,50");
  });
});

describe("formatQuantity", () => {
  it("supprime les décimales inutiles", () => {
    expect(normaliseSpaces(formatQuantity(400))).toBe("400");
  });

  it("conserve jusqu'à trois décimales pour les quantités fractionnaires", () => {
    expect(normaliseSpaces(formatQuantity(12.525))).toBe("12,525");
  });

  it("accole l'unité quand elle est fournie", () => {
    expect(normaliseSpaces(formatQuantity(60, "t"))).toBe("60 t");
  });
});

describe("formatUnitPrice", () => {
  it("autorise quatre décimales, un prix au kilo pouvant être très fin", () => {
    expect(normaliseSpaces(formatUnitPrice(8.9125))).toContain("8,9125");
  });
});

describe("formatVariance", () => {
  it("affiche toujours le signe, pour qu'une hausse se distingue d'une baisse", () => {
    expect(normaliseSpaces(formatVariance(0.2))).toContain("+20,0");
    expect(normaliseSpaces(formatVariance(-0.05))).toContain("-5,0");
  });
});

describe("formatPercent", () => {
  it("rend un ratio lisible sans décimale superflue", () => {
    expect(normaliseSpaces(formatPercent(0.01))).toBe("1 %");
    expect(normaliseSpaces(formatPercent(0))).toBe("0 %");
  });
});

describe("formatDate", () => {
  it("formate une date ISO", () => {
    expect(formatDate("2026-09-04")).toContain("2026");
  });

  it("rend un tiret pour une valeur absente ou invalide plutôt que « Invalid Date »", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("pas-une-date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("inclut l'heure, indispensable pour lire une piste d'audit", () => {
    const formatted = formatDateTime("2026-09-04T10:30:00+00:00");

    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it("rend un tiret pour une valeur absente", () => {
    expect(formatDateTime(null)).toBe("—");
  });
});
