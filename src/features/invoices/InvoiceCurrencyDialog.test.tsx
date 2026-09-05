import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InvoiceCurrencyDialog } from "./InvoiceCurrencyDialog";
import { mockApi, testId } from "@/test/api-mock";
import { normaliseSpaces } from "@/test/intl";
import type { Invoice } from "@/types/api";

const INVOICE: Invoice = {
  id: testId(9),
  reference: "FAC-2026-0009",
  status: "approved",
  status_label: "Approuvée",
  currency: "EUR",
  invoice_date: "2026-09-01",
  due_date: "2026-10-01",
  total_amount: 12000,
  purchase_order_id: testId(4),
  created_at: null,
};

describe("InvoiceCurrencyDialog", () => {
  it("annonce que le rapprochement sera rejoué et montre le total dans la devise visée", async () => {
    mockApi();
    const user = userEvent.setup();

    render(
      <InvoiceCurrencyDialog
        invoice={INVOICE}
        isOpen
        onClose={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Devise de règlement/), "XOF");

    // Le geste n'est pas cosmetique : il change l'unite dans laquelle le prix
    // facture sera confronte au prix commande. L'ecran le dit avant, pas apres.
    expect(screen.getByText(/rapprochement sera rejoué immédiatement/i)).toBeInTheDocument();

    // Les montants ne sont pas convertis : 12 000 EUR devient 12 000 XOF.
    expect(
      screen.getByText((content) => normaliseSpaces(content).includes("12 000 F CFA")),
    ).toBeInTheDocument();
  });

  it("n'envoie rien tant que la devise n'a pas changé", async () => {
    mockApi();
    render(
      <InvoiceCurrencyDialog invoice={INVOICE} isOpen onClose={vi.fn()} onChanged={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Changer et rapprocher/ })).toBeDisabled();
  });

  it("envoie la nouvelle devise puis referme", async () => {
    const api = mockApi().on(`PATCH /invoices/${testId(9)}/currency`, {
      body: { data: { ...INVOICE, currency: "XOF" } },
    });
    const onChanged = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <InvoiceCurrencyDialog invoice={INVOICE} isOpen onClose={onClose} onChanged={onChanged} />,
    );

    await user.selectOptions(screen.getByLabelText(/Devise de règlement/), "XOF");
    await user.click(screen.getByRole("button", { name: /Changer et rapprocher/ }));

    await waitFor(() => {
      const sent = api.calls.find(
        (call) => call.method === "PATCH" && call.path === "/invoices/9/currency",
      );
      expect(sent?.body).toEqual({ currency: "XOF" });
    });

    expect(onChanged).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("relaie le refus d'une facture déjà réglée", async () => {
    mockApi().on(`PATCH /invoices/${testId(9)}/currency`, {
      status: 409,
      body: {
        message:
          "La facture FAC-2026-0009 a deja fait l'objet d'un reglement : sa devise ne peut plus etre modifiee.",
        error_code: "invoice_currency_not_changeable",
      },
    });
    const user = userEvent.setup();

    render(
      <InvoiceCurrencyDialog invoice={INVOICE} isOpen onClose={vi.fn()} onChanged={vi.fn()} />,
    );

    await user.selectOptions(screen.getByLabelText(/Devise de règlement/), "XOF");
    await user.click(screen.getByRole("button", { name: /Changer et rapprocher/ }));

    // Corriger la devise apres le virement reecrirait le sens d'un paiement
    // deja execute : le refus doit rester visible, pas disparaitre.
    expect(await screen.findByRole("alert")).toHaveTextContent(/deja fait l'objet d'un reglement/);
  });
});
