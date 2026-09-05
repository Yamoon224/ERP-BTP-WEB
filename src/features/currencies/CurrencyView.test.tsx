import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { CurrencyView } from "./CurrencyView";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { CurrencyReference, ExchangeRateQuote, User } from "@/types/api";

const REFERENCE: CurrencyReference = {
  currencies: [
    { code: "EUR", label: "Euro", symbol: "€", decimals: 2 },
    { code: "USD", label: "Dollar americain", symbol: "$", decimals: 2 },
    { code: "XOF", label: "Franc CFA (BCEAO)", symbol: "F CFA", decimals: 0 },
  ],
  sources: [
    { value: "fixed_peg", label: "Parité fixe", expires: false },
    { value: "manual", label: "Saisie manuelle", expires: true },
  ],
  default_currency: "XOF",
  base_currency: "XOF",
};

const PEG: ExchangeRateQuote = {
  id: 1,
  base_currency: "EUR",
  quote_currency: "XOF",
  rate: 655.957,
  source: "fixed_peg",
  source_label: "Parité fixe",
  is_editable: false,
  effective_from: "1999-01-01",
  created_at: null,
};

const MANUAL: ExchangeRateQuote = {
  id: 2,
  base_currency: "EUR",
  quote_currency: "USD",
  rate: 1.085,
  source: "manual",
  source_label: "Saisie manuelle",
  is_editable: true,
  effective_from: "2026-01-01",
  created_at: null,
};

const ACCOUNTANT: User = {
  id: 1,
  name: "Julien Bardot",
  email: "comptable@erp.test",
  roles: ["accountant"],
  permissions: ["currencies.view", "currencies.manage"],
};

const READER: User = {
  id: 2,
  name: "Nadia Belkacem",
  email: "controleur@erp.test",
  roles: ["controller"],
  permissions: ["currencies.view"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("CurrencyView", () => {
  it("affiche le référentiel servi par l'API, décimales comprises", async () => {
    mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /currencies", { body: { data: REFERENCE } })
      .on("GET /exchange-rates", { body: paginated([]) });

    renderWithAuth(<CurrencyView />);

    // Le nombre de decimales vient du backend : le recopier cote client ferait
    // afficher deux montants differents pour la meme autorisation.
    expect(await screen.findByText(/Pas de sous-unité/)).toBeInTheDocument();
    // EUR et USD en portent deux chacun : le referentiel est bien deroule en
    // entier, pas resume a la devise de reglement.
    expect(screen.getAllByText("2 décimales")).toHaveLength(2);
  });

  it("verrouille les commandes d'une parité fixe", async () => {
    mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /currencies", { body: { data: REFERENCE } })
      .on("GET /exchange-rates", { body: paginated([PEG, MANUAL]) });

    renderWithAuth(<CurrencyView />);

    const pegRow = await screen.findByRole("row", { name: /EUR → XOF/ });
    // Une parite reglementaire n'est pas une cotation : l'interface le dit
    // avant l'API, plutot que de laisser l'utilisateur decouvrir un 409.
    expect(within(pegRow).getByRole("button", { name: "Corriger" })).toBeDisabled();
    expect(within(pegRow).getByRole("button", { name: "Supprimer" })).toBeDisabled();

    const manualRow = screen.getByRole("row", { name: /EUR → USD/ });
    expect(within(manualRow).getByRole("button", { name: "Corriger" })).toBeEnabled();
  });

  it("n'offre aucune action d'écriture sans la permission de gestion", async () => {
    mockApi()
      .on("GET /me", { body: { data: READER } })
      .on("GET /currencies", { body: { data: REFERENCE } })
      .on("GET /exchange-rates", { body: paginated([MANUAL]) });

    renderWithAuth(<CurrencyView />);

    await screen.findByRole("row", { name: /EUR → USD/ });
    expect(screen.queryByRole("button", { name: /Enregistrer un taux/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corriger" })).not.toBeInTheDocument();
  });
});
