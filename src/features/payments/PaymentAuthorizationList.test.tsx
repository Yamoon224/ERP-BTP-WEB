import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { PaymentAuthorizationList } from "./PaymentAuthorizationList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { PaymentAuthorization, User } from "@/types/api";

function authorization(overrides: Partial<PaymentAuthorization> = {}): PaymentAuthorization {
  return {
    id: 42,
    invoice_id: 3,
    match_run_id: 7,
    amount: 5030,
    currency: "EUR",
    base_amount: 5030,
    base_currency: "EUR",
    exchange_rate: 1,
    status: "active",
    status_label: "Active",
    authorized_at: "2026-09-01T10:00:00+00:00",
    is_settled: false,
    settled_at: null,
    payment_reference: null,
    payment_method: null,
    invoice: {
      id: 3,
      reference: "FAC-2026-0003",
      status: "approved",
      supplier: { id: 1, name: "Béton Express SAS" },
    },
    ...overrides,
  };
}

const ACCOUNTANT: User = {
  id: 6,
  name: "Julien Bardot",
  email: "comptable@erp.test",
  roles: ["accountant"],
  permissions: ["payments.view", "payments.manage"],
};

/** Le controleur voit les paiements mais ne les execute pas. */
const CONTROLLER: User = {
  id: 5,
  name: "Nadia Belkacem",
  email: "controleur@erp.test",
  roles: ["controller"],
  permissions: ["payments.view", "matching.review"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("PaymentAuthorizationList", () => {
  it("affiche les autorisations et leur état de règlement", async () => {
    mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /payment-authorizations", {
        body: paginated([
          authorization(),
          authorization({
            id: 43,
            is_settled: true,
            settled_at: "2026-09-03T12:00:00+00:00",
            payment_reference: "VIR-2026-00042",
            payment_method: "transfer",
          }),
        ]),
      });

    renderWithAuth(<PaymentAuthorizationList />);

    expect(await screen.findByText("En attente de règlement")).toBeInTheDocument();
    expect(screen.getByText("VIR-2026-00042")).toBeInTheDocument();
    expect(screen.getByText(/Virement/)).toBeInTheDocument();
  });

  it("réserve le règlement à qui détient payments.manage", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /payment-authorizations", { body: paginated([authorization()]) });

    renderWithAuth(<PaymentAuthorizationList />);

    await screen.findByText("FAC-2026-0003");
    expect(screen.queryByRole("button", { name: "Régler" })).not.toBeInTheDocument();
  });

  it("n'envoie aucun montant au règlement : celui du moteur fait foi", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /payment-authorizations", { body: paginated([authorization()]) })
      .on("POST /payment-authorizations/42/settle", {
        body: {
          data: authorization({
            is_settled: true,
            settled_at: "2026-09-05T09:00:00+00:00",
            payment_reference: "VIR-2026-00099",
          }),
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<PaymentAuthorizationList />);

    await user.click(await screen.findByRole("button", { name: "Régler" }));

    const dialog = screen.getByRole("dialog", { name: "Régler la facture" });
    // Le montant est montre, jamais saisi : aucun champ ne doit le porter.
    expect(within(dialog).getByText("5 030,00 €")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Montant/)).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Référence du règlement/), "VIR-2026-00099");
    await user.click(within(dialog).getByRole("button", { name: "Enregistrer le règlement" }));

    await waitFor(() => {
      const posted = api.calls.find((call) => call.method === "POST");
      expect(posted?.path).toBe("/payment-authorizations/42/settle");
      const body = posted?.body as Record<string, unknown>;
      expect(body.payment_reference).toBe("VIR-2026-00099");
      expect(body).not.toHaveProperty("amount");
    });
  });

  it("relaie un refus du backend sur une autorisation déjà réglée", async () => {
    mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /payment-authorizations", { body: paginated([authorization()]) })
      .on("POST /payment-authorizations/42/settle", {
        status: 409,
        body: {
          message: "Cette autorisation a deja ete reglee le 03/09/2026.",
          error_code: "payment_already_settled",
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<PaymentAuthorizationList />);

    await user.click(await screen.findByRole("button", { name: "Régler" }));
    await user.type(screen.getByLabelText(/Référence du règlement/), "VIR-2026-00099");
    await user.click(screen.getByRole("button", { name: "Enregistrer le règlement" }));

    expect(
      await screen.findByText("Cette autorisation a deja ete reglee le 03/09/2026."),
    ).toBeInTheDocument();
  });

  it("transmet le filtre de règlement à l'API", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /payment-authorizations", { body: paginated([authorization()]) });

    const user = userEvent.setup();
    renderWithAuth(<PaymentAuthorizationList />);

    await screen.findByText("FAC-2026-0003");
    await user.selectOptions(screen.getByLabelText(/Règlement/), "false");

    await waitFor(() => {
      expect(api.calls.some((call) => call.path.includes("settled=false"))).toBe(true);
    });
  });
});
