import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { DeliveryNoteList } from "./DeliveryNoteList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { DeliveryNote, User } from "@/types/api";

function deliveryNote(overrides: Partial<DeliveryNote> = {}): DeliveryNote {
  return {
    id: 4,
    reference: "BL-2026-0004",
    status: "draft",
    status_label: "Brouillon",
    counts_as_received: false,
    received_at: "2026-09-01",
    notes: null,
    purchase_order_id: 2,
    purchase_order: { id: 2, reference: "PO-2026-0002", status: "open" },
    supplier: {
      id: 1,
      code: "SUP-BETON",
      name: "Béton Express SAS",
      vat_number: null,
      email: null,
      is_active: true,
      created_at: null,
    },
    lines: [],
    lines_count: 1,
    created_at: null,
    ...overrides,
  };
}

const WAREHOUSE: User = {
  id: 3,
  name: "Sofia Ferreira",
  email: "magasinier@erp.test",
  roles: ["warehouse"],
  permissions: ["procurement.view", "receiving.view", "receiving.manage"],
};

const BUYER: User = {
  id: 2,
  name: "Marc Lemoine",
  email: "acheteur@erp.test",
  roles: ["buyer"],
  // Un acheteur consulte les receptions mais ne les valide pas : separation
  // des taches entre celui qui commande et celui qui constate la livraison.
  permissions: ["procurement.view", "procurement.manage", "receiving.view"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("DeliveryNoteList", () => {
  it("indique qu'un bon en brouillon n'ouvre aucun droit à paiement", async () => {
    mockApi()
      .on("GET /me", { body: { data: WAREHOUSE } })
      .on("GET /delivery-notes", { body: paginated([deliveryNote()]) });

    renderWithAuth(<DeliveryNoteList />);

    expect(await screen.findByText("BL-2026-0004")).toBeInTheDocument();
    expect(screen.getByText("N'ouvre aucun droit à paiement")).toBeInTheDocument();
  });

  it("propose accepter/refuser à un magasinier sur un bon en brouillon", async () => {
    mockApi()
      .on("GET /me", { body: { data: WAREHOUSE } })
      .on("GET /delivery-notes", { body: paginated([deliveryNote()]) });

    renderWithAuth(<DeliveryNoteList />);

    expect(await screen.findByRole("button", { name: "Accepter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refuser" })).toBeInTheDocument();
  });

  it("masque le contrôle de réception pour un acheteur", async () => {
    mockApi()
      .on("GET /me", { body: { data: BUYER } })
      .on("GET /delivery-notes", { body: paginated([deliveryNote()]) });

    renderWithAuth(<DeliveryNoteList />);

    await screen.findByText("BL-2026-0004");
    expect(screen.queryByRole("button", { name: "Accepter" })).not.toBeInTheDocument();
  });

  it("n'offre plus d'action sur un bon déjà contrôlé", async () => {
    mockApi()
      .on("GET /me", { body: { data: WAREHOUSE } })
      .on("GET /delivery-notes", {
        body: paginated([
          deliveryNote({ status: "accepted", status_label: "Accepté", counts_as_received: true }),
        ]),
      });

    renderWithAuth(<DeliveryNoteList />);

    expect(await screen.findByText("Accepté")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accepter" })).not.toBeInTheDocument();
  });

  it("envoie l'acceptation puis recharge la liste", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: WAREHOUSE } })
      .on("GET /delivery-notes", { body: paginated([deliveryNote()]) })
      .on("POST /delivery-notes/4/review", {
        body: {
          data: deliveryNote({ status: "accepted", status_label: "Accepté", counts_as_received: true }),
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<DeliveryNoteList />);

    await user.click(await screen.findByRole("button", { name: "Accepter" }));

    await waitFor(() => {
      const reviewCall = api.calls.find((call) => call.method === "POST");
      expect(reviewCall?.path).toBe("/delivery-notes/4/review");
      expect(reviewCall?.body).toEqual({ status: "accepted" });
    });

    await waitFor(() => {
      const listCalls = api.calls.filter((call) => call.path.startsWith("/delivery-notes?"));
      expect(listCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("affiche l'erreur métier quand le contrôle est refusé par le backend", async () => {
    mockApi()
      .on("GET /me", { body: { data: WAREHOUSE } })
      .on("GET /delivery-notes", { body: paginated([deliveryNote()]) })
      .on("POST /delivery-notes/4/review", {
        status: 409,
        body: {
          message: "Le bon de livraison BL-2026-0004 est déjà Accepté.",
          error_code: "delivery_note_already_reviewed",
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<DeliveryNoteList />);

    await user.click(await screen.findByRole("button", { name: "Accepter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("est déjà Accepté");
  });
});
