import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeliveryNoteFormDialog } from "./DeliveryNoteFormDialog";
import { mockApi, paginated } from "@/test/api-mock";
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

function mockOrders() {
  return mockApi()
    .on("GET /purchase-orders", { body: paginated([ORDER]) })
    .on("GET /purchase-orders/4", { body: { data: ORDER } });
}

async function chooseOrder(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: /Bon de commande/ }));
  await user.click(await screen.findByRole("option", { name: /PO-2026-0004/ }));
}

describe("DeliveryNoteFormDialog", () => {
  it("n'ouvre à la saisie que les lignes du bon de commande choisi", async () => {
    mockOrders();
    const user = userEvent.setup();

    render(<DeliveryNoteFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);
    await chooseOrder(user);

    // Une reception ne peut pas porter sur un article non commande : il n'y a
    // donc aucun moyen d'ajouter une ligne.
    expect(await screen.findByLabelText(/Quantité reçue pour CIM-42/)).toHaveValue(400);
    expect(screen.getByLabelText(/Quantité reçue pour SAB-01/)).toHaveValue(60);
    expect(screen.queryByRole("button", { name: /Ajouter une ligne/ })).not.toBeInTheDocument();
  });

  it("n'envoie pas les lignes laissées à zéro", async () => {
    const api = mockOrders().on("POST /delivery-notes", {
      status: 201,
      body: { data: { id: 8, reference: "BL-2026-0008" } },
    });

    const user = userEvent.setup();
    render(<DeliveryNoteFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Référence du bon de livraison/), "BL-2026-0008");
    await chooseOrder(user);

    // Livraison partielle sur la premiere ligne, rien sur la seconde.
    const first = await screen.findByLabelText(/Quantité reçue pour CIM-42/);
    await user.clear(first);
    await user.type(first, "250");

    const second = screen.getByLabelText(/Quantité reçue pour SAB-01/);
    await user.clear(second);
    await user.type(second, "0");

    await user.click(screen.getByRole("button", { name: /Enregistrer la réception/ }));

    await waitFor(() => {
      const posted = api.calls.find(
        (call) => call.method === "POST" && call.path === "/delivery-notes",
      );
      const body = posted?.body as { lines: Array<Record<string, unknown>> };
      expect(body.lines).toEqual([{ purchase_order_line_id: 40, quantity_received: 250 }]);
      // Le fournisseur vient du bon de commande, jamais du formulaire.
      expect(body).not.toHaveProperty("supplier_id");
    });
  });

  it("annonce que la réception reste en brouillon jusqu'à son contrôle", async () => {
    mockOrders();

    render(<DeliveryNoteFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByText(/enregistrée en brouillon/)).toBeInTheDocument();
  });

  it("empêche l'enregistrement tant que rien n'est reçu", async () => {
    mockOrders();
    const user = userEvent.setup();

    render(<DeliveryNoteFormDialog isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    // Sans bon de commande, il n'y a aucune ligne : rien a enregistrer.
    expect(screen.getByRole("button", { name: /Enregistrer la réception/ })).toBeDisabled();

    await chooseOrder(user);
    await screen.findByLabelText(/Quantité reçue pour CIM-42/);

    expect(screen.getByRole("button", { name: /Enregistrer la réception/ })).toBeEnabled();
  });
});
