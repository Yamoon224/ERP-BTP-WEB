import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchRunSummary } from "./MatchRunSummary";
import type { MatchRun } from "@/types/api";
import { normaliseSpaces } from "@/test/intl";

function matchRun(overrides: Partial<MatchRun> = {}): MatchRun {
  return {
    id: 12,
    invoice_id: 5,
    status: "matched",
    status_label: "Rapproché",
    decided_by: { actor_type: "system", actor_id: null, label: "Moteur de rapprochement v1.0.0" },
    trigger: "invoice_submitted",
    engine_version: "1.0.0",
    tolerance_snapshot: {
      price_ratio: 0.01,
      price_absolute: 0.5,
      quantity_ratio: 0,
      quantity_absolute: 0,
      currency: "EUR",
    },
    exchange_rate_snapshot: null,
    evaluated_at: "2026-09-04T10:00:00+00:00",
    currency: "EUR",
    invoiced_amount: 1000,
    matched_amount: 1000,
    unmatched_amount: 0,
    base_currency: "EUR",
    base_matched_amount: 1000,
    base_unmatched_amount: 0,
    exception_count: 0,
    created_at: null,
    ...overrides,
  };
}

describe("MatchRunSummary", () => {
  it("expose qui a décidé, quand et avec quelle version du moteur", () => {
    render(<MatchRunSummary run={matchRun()} currency="EUR" />);

    expect(screen.getByText("Moteur de rapprochement v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Automatique")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Soumission de la facture")).toBeInTheDocument();
  });

  it("distingue une décision humaine d'une décision du moteur", () => {
    render(
      <MatchRunSummary
        run={matchRun({
          decided_by: { actor_type: "user", actor_id: 5, label: "Nadia Belkacem" },
          trigger: "exception_reviewed",
        })}
        currency="EUR"
      />,
    );

    expect(screen.getByText("Nadia Belkacem")).toBeInTheDocument();
    expect(screen.getByText("Utilisateur")).toBeInTheDocument();
    expect(screen.getByText("Arbitrage d'un écart")).toBeInTheDocument();
  });

  it("n'affiche aucun bloc de conversion en mono-devise", () => {
    render(<MatchRunSummary run={matchRun()} currency="EUR" />);

    expect(screen.queryByText(/Conversion appliquée/)).not.toBeInTheDocument();
  });

  it("affiche le taux appliqué, sa source et sa date quand une conversion a eu lieu", () => {
    render(
      <MatchRunSummary
        run={matchRun({
          currency: "USD",
          invoiced_amount: 1085,
          matched_amount: 1085,
          base_matched_amount: 1000,
          exchange_rate_snapshot: {
            invoice_currency: "USD",
            comparison_currency: "EUR",
            base_currency: "EUR",
            invoice_to_comparison: {
              from: "USD",
              to: "EUR",
              rate: 0.9217,
              source: "manual",
              effective_from: "2026-01-01",
            },
            invoice_to_base: {
              from: "USD",
              to: "EUR",
              rate: 0.9217,
              source: "manual",
              effective_from: "2026-01-01",
            },
          },
        })}
        currency="USD"
      />,
    );

    expect(screen.getByText(/Conversion appliquée/)).toBeInTheDocument();
    // Le taux doit être lisible tel qu'appliqué, pour pouvoir refaire le calcul.
    expect(screen.getByText(/1 USD = 0,9217 EUR/)).toBeInTheDocument();
    expect(screen.getByText(/saisie manuelle/)).toBeInTheDocument();
    expect(screen.getByText(/en vigueur au/)).toBeInTheDocument();
  });

  it("montre la contre-valeur du montant autorisé lorsque les devises diffèrent", () => {
    render(
      <MatchRunSummary
        run={matchRun({
          currency: "USD",
          matched_amount: 1085,
          base_matched_amount: 1000,
          exchange_rate_snapshot: {
            invoice_currency: "USD",
            comparison_currency: "EUR",
            base_currency: "EUR",
            invoice_to_base: {
              from: "USD",
              to: "EUR",
              rate: 0.9217,
              source: "manual",
              effective_from: null,
            },
          },
        })}
        currency="USD"
      />,
    );

    expect(normaliseSpaces(screen.getByText(/≈/).textContent ?? "")).toContain("1 000,00");
  });

  it("qualifie une parité fixe comme telle, et non comme une cotation", () => {
    render(
      <MatchRunSummary
        run={matchRun({
          currency: "XOF",
          exchange_rate_snapshot: {
            invoice_currency: "XOF",
            comparison_currency: "EUR",
            base_currency: "EUR",
            invoice_to_comparison: {
              from: "XOF",
              to: "EUR",
              rate: 0.001524,
              source: "fixed_peg",
              effective_from: "1999-01-01",
            },
          },
        })}
        currency="XOF"
      />,
    );

    expect(screen.getByText(/parité fixe/)).toBeInTheDocument();
  });

  it("exprime la tolérance absolue dans la devise où elle a été appliquée", () => {
    // Le seuil est configuré en euro puis converti : l'afficher en euro alors
    // qu'il a été appliqué en francs CFA serait faux.
    render(
      <MatchRunSummary
        run={matchRun({
          currency: "XOF",
          tolerance_snapshot: {
            price_ratio: 0.01,
            price_absolute: 327.98,
            quantity_ratio: 0,
            quantity_absolute: 0,
            currency: "XOF",
          },
        })}
        currency="XOF"
      />,
    );

    const tolerance = normaliseSpaces(screen.getByText(/\/ unité/).textContent ?? "");

    expect(tolerance).toContain("328");
    expect(tolerance).toContain("CFA");
  });
});
