import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { MatchRunList } from "./MatchRunList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated, testId } from "@/test/api-mock";
import type { MatchRun, User } from "@/types/api";

const RUN: MatchRun = {
  id: testId(42),
  invoice_id: testId(9),
  status: "partially_matched",
  status_label: "Partiellement rapproché",
  decided_by: { actor_type: "system", actor_id: null, label: "Moteur de rapprochement" },
  trigger: "invoice_submitted",
  engine_version: "1.0.0",
  tolerance_snapshot: {
    price_ratio: 0.01,
    price_absolute: 250,
    quantity_ratio: 0,
    quantity_absolute: 0,
    currency: "XOF",
  },
  exchange_rate_snapshot: null,
  evaluated_at: "2026-09-04T10:00:00+00:00",
  currency: "XOF",
  invoiced_amount: 1000000,
  matched_amount: 600000,
  unmatched_amount: 400000,
  base_currency: "XOF",
  base_matched_amount: 600000,
  base_unmatched_amount: 400000,
  exception_count: 2,
  invoice: {
    id: testId(9),
    reference: "FAC-2026-0009",
    status: "partially_approved",
    currency: "XOF",
    supplier: { id: testId(3), name: "Béton Express SAS" },
  },
  created_at: null,
};

const CONTROLLER: User = {
  id: testId(1),
  name: "Nadia Belkacem",
  email: "controleur@erp.test",
  roles: ["controller"],
  permissions: ["matching.view", "matching.run"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("MatchRunList", () => {
  it("montre le verdict, son auteur et la facture concernée", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-runs", { body: paginated([RUN]) });

    renderWithAuth(<MatchRunList />);

    const row = await screen.findByRole("row", { name: /FAC-2026-0009/ });

    expect(within(row).getByText("Partiellement rapproché")).toBeInTheDocument();
    expect(within(row).getByText("Béton Express SAS")).toBeInTheDocument();
    expect(within(row).getByText("Moteur de rapprochement")).toBeInTheDocument();
    expect(within(row).getByText("Soumission de la facture")).toBeInTheDocument();
    // Les ecarts ouverts sont le chiffre qui declenche une action humaine.
    expect(within(row).getByText("2")).toBeInTheDocument();
  });

  it("n'offre aucune modification ni suppression d'exécution", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-runs", { body: paginated([RUN]) });

    renderWithAuth(<MatchRunList />);

    await screen.findByRole("row", { name: /FAC-2026-0009/ });

    // Une execution archive une decision et sa preuve : la retoucher
    // reviendrait a reecrire le passe, l'effacer a supprimer la justification
    // d'un paiement deja autorise. Le registre est donc en lecture seule, et
    // l'ecran l'explique au lieu de laisser croire a un oubli.
    expect(screen.queryByRole("button", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/immuable/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/rejoue/i);
  });
});
