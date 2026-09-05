import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { SupplierList } from "./SupplierList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { Supplier, User } from "@/types/api";

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 7,
    code: "SUP-BETON",
    name: "Béton Express SAS",
    vat_number: "FR12345678901",
    email: "facturation@beton-express.example",
    is_active: true,
    created_at: "2026-03-01T09:00:00+00:00",
    ...overrides,
  };
}

const BUYER: User = {
  id: 1,
  name: "Marc Lemoine",
  email: "acheteur@erp.test",
  roles: ["buyer"],
  permissions: ["procurement.view", "procurement.manage"],
};

/** Un compte qui consulte le referentiel sans pouvoir le modifier. */
const READER: User = {
  id: 2,
  name: "Sofia Ferreira",
  email: "magasinier@erp.test",
  roles: ["warehouse"],
  permissions: ["procurement.view"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("SupplierList", () => {
  it("affiche les fiches et leur état", async () => {
    mockApi()
      .on("GET /me", { body: { data: BUYER } })
      .on("GET /suppliers", { body: paginated([supplier(), supplier({ id: 8, code: "SUP-OLD", name: "Ancien Fournisseur", is_active: false })]) });

    renderWithAuth(<SupplierList />);

    expect(await screen.findByText("Béton Express SAS")).toBeInTheDocument();

    const active = screen.getByRole("row", { name: /Béton Express SAS/ });
    expect(within(active).getByText("Actif")).toBeInTheDocument();

    const inactive = screen.getByRole("row", { name: /Ancien Fournisseur/ });
    expect(within(inactive).getByText("Inactif")).toBeInTheDocument();
  });

  it("n'offre aucune action d'écriture sans la permission de gestion", async () => {
    mockApi()
      .on("GET /me", { body: { data: READER } })
      .on("GET /suppliers", { body: paginated([supplier()]) });

    renderWithAuth(<SupplierList />);

    await screen.findByText("Béton Express SAS");
    expect(screen.queryByRole("button", { name: /Créer un fournisseur/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();
    // La consultation reste ouverte : le detail n'est pas une ecriture.
    expect(screen.getByRole("link", { name: "Détail" })).toBeInTheDocument();
  });

  it("crée une fiche", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: BUYER } })
      .on("GET /suppliers", { body: paginated([]) })
      .on("POST /suppliers", { status: 201, body: { data: supplier() } });

    const user = userEvent.setup();
    renderWithAuth(<SupplierList />);

    await user.click(await screen.findByRole("button", { name: /Créer un fournisseur/ }));

    await user.type(screen.getByLabelText(/^Code/), "SUP-BETON");
    await user.type(screen.getByLabelText(/Raison sociale/), "Béton Express SAS");
    await user.click(screen.getByRole("button", { name: /Créer le fournisseur/ }));

    await waitFor(() => {
      const posted = api.calls.find((call) => call.method === "POST" && call.path === "/suppliers");
      expect(posted?.body).toMatchObject({
        code: "SUP-BETON",
        name: "Béton Express SAS",
        is_active: true,
      });
    });
  });

  it("explique le refus quand la fiche est encore citée par un document", async () => {
    mockApi()
      .on("GET /me", { body: { data: BUYER } })
      .on("GET /suppliers", { body: paginated([supplier()]) })
      .on("DELETE /suppliers/7", {
        status: 409,
        body: {
          message:
            "Le fournisseur Béton Express SAS est rattache a 3 document(s) : il ne peut pas etre supprime.",
          error_code: "supplier_in_use",
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<SupplierList />);

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: /Supprimer définitivement/ }));

    // Le refus metier est la reponse la plus utile de l'ecran : il ne doit pas
    // disparaitre en silence, et il indique le geste de remplacement.
    expect(await screen.findByRole("alert")).toHaveTextContent(/rattache a 3 document/);
    expect(screen.getByText(/désactivez-le/i)).toBeInTheDocument();
  });
});
