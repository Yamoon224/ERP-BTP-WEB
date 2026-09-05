import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InvoiceFormDialog } from "./InvoiceFormDialog";
import { mockApi, paginated } from "@/test/api-mock";
import { normaliseSpaces } from "@/test/intl";
import type { PurchaseOrder } from "@/types/api";

const ORDER: PurchaseOrder = {
  id: 4,
  reference: "PO-2026-0004",
  status: "open",
  status_label: "Ouvert",
  currency: "EUR",
  ordered_at: "2026-08-01",
  notes: null,
  supplier: {
    id: 1,
    code: "SUP-BETON",
    name: "Béton Express SAS",
    vat_number: null,
    email: null,
    is_active: true,
    created_at: null,
  },
  lines: [
    {
      id: 40,
      line_number: 1,
      item_code: "CIM-42",
      description: "Ciment CEM II 42,5",
      unit: "sac",
      quantity_ordered: 400,
      unit_price: 8.9,
      ordered_amount: 3560,
    },
    {
      id: 41,
      line_number: 2,
      item_code: "SAB-01",
      description: "Sable 0/4 lavé",
      unit: "t",
      quantity_ordered: 60,
      unit_price: 24.5,
      ordered_amount: 1470,
    },
  ],
  created_at: null,
};

/** Le PO clos ne doit pas etre propose : le backend refuserait le document. */
const CLOSED_ORDER: PurchaseOrder = {
  ...ORDER,
  id: 5,
  reference: "PO-2026-0005",
  status: "closed",
  status_label: "Clôturé",
};

function mockOrders() {
  return mockApi()
    .on("GET /suppliers", { body: paginated([ORDER.supplier!]) })
    .on("GET /purchase-orders", { body: paginated([ORDER, CLOSED_ORDER]) })
    .on("GET /purchase-orders/4", { body: { data: ORDER } });
}

async function chooseOrder(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: /Bon de commande/ }));
  await user.click(await screen.findByRole("option", { name: /PO-2026-0004/ }));
}

describe("InvoiceFormDialog", () => {
  it("ne propose que les bons de commande qui acceptent encore des documents", async () => {
    mockOrders();
    const user = userEvent.setup();

    render(<InvoiceFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.click(screen.getByRole("combobox", { name: /Bon de commande/ }));

    expect(await screen.findByRole("option", { name: /PO-2026-0004/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /PO-2026-0005/ })).not.toBeInTheDocument();
  });

  it("pré-remplit les lignes au bon de commande et calcule le total", async () => {
    mockOrders();
    const user = userEvent.setup();

    render(<InvoiceFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);
    await chooseOrder(user);

    expect(await screen.findByLabelText(/Quantité facturée pour CIM-42/)).toHaveValue(400);
    expect(screen.getByLabelText(/Prix unitaire facturé pour CIM-42/)).toHaveValue(8.9);
    // 400 x 8,90 + 60 x 24,50 = 5 030. Le total s'affiche dans la devise de
    // reglement — le franc CFA — et non dans celle du bon de commande : c'est
    // dans cette unite que le virement partira. Le CFA n'ayant pas de
    // sous-unite, aucun centime n'est affiche.
    expect(
      screen.getByText((content) => normaliseSpaces(content) === "5 030 F CFA"),
    ).toBeInTheDocument();
  });

  it("soumet les lignes retenues, écarts compris", async () => {
    const api = mockOrders().on("POST /invoices", {
      status: 201,
      body: { data: { id: 9, reference: "FAC-2026-0009" } },
    });

    const user = userEvent.setup();
    render(<InvoiceFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Référence fournisseur/), "FAC-2026-0009");
    await chooseOrder(user);

    // Le fournisseur facture plus cher que commande : l'ecran n'empeche rien,
    // c'est le moteur qui signalera l'ecart.
    const priceField = await screen.findByLabelText(/Prix unitaire facturé pour CIM-42/);
    await user.clear(priceField);
    await user.type(priceField, "9.60");

    // La seconde ligne n'est pas facturee.
    await user.click(screen.getByLabelText(/Facturer la ligne SAB-01/));

    await user.click(screen.getByRole("button", { name: /Soumettre et rapprocher/ }));

    await waitFor(() => {
      const posted = api.calls.find((call) => call.method === "POST" && call.path === "/invoices");
      expect(posted).toBeDefined();
      const body = posted?.body as { lines: Array<Record<string, unknown>>; currency: string };
      // La facture nait en devise de reglement, pas dans celle du contrat.
      expect(body.currency).toBe("XOF");
      expect(body.lines).toEqual([
        {
          purchase_order_line_id: 40,
          description: "Ciment CEM II 42,5",
          quantity: 400,
          unit_price: 9.6,
        },
      ]);
      // Ni fournisseur ni total : le backend les derive, et les accepter ici
      // ouvrirait la porte a une facture dont l'en-tete contredit ses lignes.
      expect(body).not.toHaveProperty("supplier_id");
      expect(body).not.toHaveProperty("total_amount");
    });
  });

  it("relaie une erreur de validation champ par champ", async () => {
    mockOrders().on("POST /invoices", {
      status: 422,
      body: {
        message: "Les données fournies sont invalides.",
        error_code: "validation_failed",
        errors: { reference: ["Cette référence existe déjà pour ce fournisseur."] },
      },
    });

    const user = userEvent.setup();
    render(<InvoiceFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Référence fournisseur/), "FAC-2026-0001");
    await chooseOrder(user);
    await screen.findByLabelText(/Quantité facturée pour CIM-42/);
    await user.click(screen.getByRole("button", { name: /Soumettre et rapprocher/ }));

    expect(
      await screen.findByText("Cette référence existe déjà pour ce fournisseur."),
    ).toBeInTheDocument();
  });

  it("empêche la soumission tant qu'aucune ligne n'est retenue", async () => {
    mockOrders();
    const user = userEvent.setup();

    render(<InvoiceFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);
    await chooseOrder(user);

    const table = await screen.findByRole("table");
    for (const checkbox of within(table).getAllByRole("checkbox")) {
      await user.click(checkbox);
    }

    expect(screen.getByRole("button", { name: /Soumettre et rapprocher/ })).toBeDisabled();
  });
});
