import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { InvoiceList } from "./InvoiceList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { Invoice, User } from "@/types/api";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 1,
    reference: "FAC-2026-0001",
    status: "approved",
    status_label: "Approuvée",
    currency: "EUR",
    invoice_date: "2026-09-01",
    due_date: "2026-09-30",
    total_amount: 5030,
    supplier: {
      id: 1,
      code: "SUP-BETON",
      name: "Béton Express SAS",
      vat_number: null,
      email: null,
      is_active: true,
      created_at: null,
    },
    purchase_order_id: 1,
    latest_match_run: null,
    created_at: null,
    ...overrides,
  };
}

const ACCOUNTANT: User = {
  id: 6,
  name: "Julien Bardot",
  email: "comptable@erp.test",
  roles: ["accountant"],
  permissions: ["invoicing.view", "invoicing.manage", "matching.view", "matching.run"],
};

/**
 * Rend la liste dans un vrai AuthProvider : les actions d'ecriture (saisir une
 * facture, relancer un rapprochement) dependent des permissions du compte
 * courant, qui vient de la reponse simulee de `GET /me`.
 */
function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

/**
 * Test d'intégration : le composant traverse le service, le client API et la
 * gestion d'état réels ; seule la couche réseau est simulée.
 */
describe("InvoiceList", () => {
  it("affiche les factures renvoyées par l'API", async () => {
    mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", {
      body: paginated([
        invoice(),
        invoice({ id: 2, reference: "FAC-2026-0002", status: "under_review", status_label: "En revue" }),
      ]),
    });

    renderWithAuth(<InvoiceList />);

    expect(await screen.findByText("FAC-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("FAC-2026-0002")).toBeInTheDocument();
    expect(screen.getAllByText("Béton Express SAS")).toHaveLength(2);
  });

  it("montre l'état de chargement avant l'arrivée des données", () => {
    mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", { body: paginated([]) });

    renderWithAuth(<InvoiceList />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("affiche un état vide explicite plutôt qu'un tableau sans lignes", async () => {
    mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", { body: paginated([]) });

    renderWithAuth(<InvoiceList />);

    expect(await screen.findByText("Aucune facture")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("affiche l'erreur de l'API et propose de réessayer", async () => {
    mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", {
      status: 403,
      body: { message: "Droits insuffisants.", error_code: "forbidden" },
    });

    renderWithAuth(<InvoiceList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Droits insuffisants.");
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });

  it("met en avant le montant autorisé au paiement", async () => {
    mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", {
      body: paginated([
        invoice({
          total_amount: 3680,
          status: "partially_approved",
          status_label: "Partiellement approuvée",
          latest_match_run: {
            id: 9,
            invoice_id: 1,
            status: "partially_matched",
            status_label: "Partiellement rapproché",
            decided_by: { actor_type: "system", actor_id: null, label: "Moteur" },
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
            evaluated_at: "2026-09-01T10:00:00+00:00",
            currency: "EUR",
            invoiced_amount: 3680,
            matched_amount: 2208,
            unmatched_amount: 1472,
            base_currency: "EUR",
            base_matched_amount: 2208,
            base_unmatched_amount: 1472,
            exception_count: 0,
            created_at: null,
          },
        }),
      ]),
    });

    renderWithAuth(<InvoiceList />);

    const row = (await screen.findByText("FAC-2026-0001")).closest("tr");
    expect(within(row as HTMLElement).getByText(/2 208,00/)).toBeInTheDocument();
  });

  it("signale le nombre d'écarts ouverts sur une facture", async () => {
    mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", {
      body: paginated([
        invoice({ status: "under_review", status_label: "En revue", open_exceptions_count: 2 }),
      ]),
    });

    renderWithAuth(<InvoiceList />);

    expect(await screen.findByText("2 écarts")).toBeInTheDocument();
  });

  it("transmet la recherche à l'API, une fois la frappe terminée", async () => {
    const api = mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", { body: paginated([invoice()]) });
    const user = userEvent.setup();

    renderWithAuth(<InvoiceList />);
    await screen.findByText("FAC-2026-0001");

    await user.type(screen.getByLabelText("Rechercher une facture"), "BETON");

    // La requete est differee : c'est la derniere frappe qui part, pas les cinq.
    await waitFor(() => {
      expect(api.calls.some((call) => call.path.includes("search=BETON"))).toBe(true);
    });
    expect(api.calls.filter((call) => call.path.includes("search=")).length).toBe(1);
  });

  it("transmet le filtre de statut à l'API", async () => {
    const api = mockApi().on("GET /me", { body: { data: ACCOUNTANT } }).on("GET /invoices", { body: paginated([invoice()]) });
    const user = userEvent.setup();

    renderWithAuth(<InvoiceList />);
    await screen.findByText("FAC-2026-0001");

    await user.selectOptions(screen.getByLabelText("Statut"), "under_review");

    await waitFor(() => {
      expect(api.calls.some((call) => call.path.includes("status=under_review"))).toBe(true);
    });
  });
});
