import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./DashboardOverview";
import { mockApi } from "@/test/api-mock";
import type { DashboardSummary } from "@/types/api";

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    invoices: {
      received: 1,
      under_review: 2,
      partially_approved: 1,
      approved: 3,
      disputed: 0,
      cancelled: 0,
    },
    exceptions: {
      open: 2,
      by_type: { price_variance: 1, quantity_over_ordered: 1 },
      by_severity: { medium: 1, high: 1 },
    },
    amounts: {
      authorized_for_payment: 8588,
      blocked: 10854.5,
      currency: "EUR",
      by_currency: [
        { currency: "EUR", amount: 5030, base_amount: 5030 },
        { currency: "USD", amount: 3861.03, base_amount: 3558 },
      ],
    },
    ...overrides,
  };
}

describe("DashboardOverview", () => {
  it("met en avant les montants autorisé et bloqué", async () => {
    mockApi().on("GET /dashboard/matching", { body: { data: summary() } });

    render(<DashboardOverview />);

    expect(await screen.findByText(/8 588,00/)).toBeInTheDocument();
    expect(screen.getByText(/10 854,50/)).toBeInTheDocument();
  });

  it("affiche la charge de revue en attente", async () => {
    mockApi().on("GET /dashboard/matching", { body: { data: summary() } });

    render(<DashboardOverview />);

    expect(await screen.findByText("Écarts à arbitrer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /file de revue/i })).toHaveAttribute(
      "href",
      "/exceptions",
    );
  });

  it("ne propose pas la file de revue quand aucun écart n'est ouvert", async () => {
    mockApi().on("GET /dashboard/matching", {
      body: {
        data: summary({ exceptions: { open: 0, by_type: {}, by_severity: {} } }),
      },
    });

    render(<DashboardOverview />);

    expect(await screen.findByText("Aucun écart en attente.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /file de revue/i })).not.toBeInTheDocument();
  });

  it("liste tous les statuts de facture, y compris ceux à zéro", async () => {
    mockApi().on("GET /dashboard/matching", { body: { data: summary() } });

    render(<DashboardOverview />);

    // Un tableau de bord qui masque les colonnes vides oblige le lecteur à
    // deviner : « Litigieuse » doit apparaître même à zéro.
    expect(await screen.findByText("Litigieuse")).toBeInTheDocument();
    expect(screen.getByText("Approuvée")).toBeInTheDocument();
  });

  it("affiche une erreur exploitable si l'API échoue", async () => {
    mockApi().on("GET /dashboard/matching", {
      status: 500,
      body: { message: "Erreur serveur.", error_code: "server_error" },
    });

    render(<DashboardOverview />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erreur serveur.");
  });
});
