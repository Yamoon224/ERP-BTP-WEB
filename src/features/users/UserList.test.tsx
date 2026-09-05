import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { UserList } from "./UserList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { AdminUser, Role, User } from "@/types/api";

function account(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 11,
    name: "Sofia Ferreira",
    email: "magasinier@erp.test",
    roles: ["warehouse"],
    permissions: ["procurement.view", "receiving.view", "receiving.manage"],
    created_at: "2026-03-01T09:00:00+00:00",
    ...overrides,
  };
}

const ADMIN: User = {
  id: 1,
  name: "Awa Diop",
  email: "admin@erp.test",
  roles: ["admin"],
  permissions: ["users.view", "users.manage"],
};

/** Un compte qui peut consulter les utilisateurs sans pouvoir les modifier. */
const READER: User = {
  id: 2,
  name: "Lecteur",
  email: "lecteur@erp.test",
  roles: ["controller"],
  permissions: ["users.view"],
};

const ROLES: Role[] = [
  { name: "warehouse", permissions: ["receiving.view", "receiving.manage"] },
  { name: "accountant", permissions: ["invoicing.manage", "matching.run"] },
];

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("UserList", () => {
  it("affiche les comptes avec leurs rôles en clair", async () => {
    mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account()]) });

    renderWithAuth(<UserList />);

    expect(await screen.findByText("Sofia Ferreira")).toBeInTheDocument();
    expect(screen.getByText("magasinier@erp.test")).toBeInTheDocument();
    // Le libelle metier, pas le code technique du role. La pastille de la
    // ligne, pas l'option homonyme du filtre.
    const row = screen.getByRole("row", { name: /Sofia Ferreira/ });
    expect(within(row).getByText("Magasinier")).toBeInTheDocument();
  });

  it("n'offre aucune action d'écriture sans la permission de gestion", async () => {
    mockApi()
      .on("GET /me", { body: { data: READER } })
      .on("GET /users", { body: paginated([account()]) });

    renderWithAuth(<UserList />);

    await screen.findByText("Sofia Ferreira");
    expect(screen.queryByRole("button", { name: /Créer un compte/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();
  });

  it("crée un compte avec ses rôles", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account()]) })
      .on("POST /users", { status: 201, body: { data: account({ id: 99, name: "Nouvelle Recrue" }) } });

    const user = userEvent.setup();
    renderWithAuth(<UserList />);

    await user.click(await screen.findByRole("button", { name: /Créer un compte/ }));

    await user.type(screen.getByLabelText(/Nom affiché/), "Nouvelle Recrue");
    await user.type(screen.getByLabelText(/Adresse e-mail/), "recrue@erp.test");
    await user.type(screen.getByLabelText(/^Mot de passe/), "mot-de-passe-solide");
    await user.click(await screen.findByLabelText(/Magasinier/));

    await user.click(screen.getByRole("button", { name: "Créer le compte" }));

    await waitFor(() => {
      const posted = api.calls.find((call) => call.method === "POST" && call.path === "/users");
      expect(posted?.body).toEqual({
        name: "Nouvelle Recrue",
        email: "recrue@erp.test",
        password: "mot-de-passe-solide",
        roles: ["warehouse"],
      });
    });
  });

  it("envoie un mot de passe nul à la modification quand le champ est laissé vide", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account()]) })
      .on("PATCH /users/11", { body: { data: account({ name: "Sofia Ferreira-Nunes" }) } });

    const user = userEvent.setup();
    renderWithAuth(<UserList />);

    await user.click(await screen.findByRole("button", { name: "Modifier" }));

    const nameField = screen.getByLabelText(/Nom affiché/);
    await user.clear(nameField);
    await user.type(nameField, "Sofia Ferreira-Nunes");

    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      const patched = api.calls.find((call) => call.method === "PATCH");
      // `null` et non `""` : le backend doit comprendre « ne change rien »,
      // pas « efface le mot de passe ».
      expect((patched?.body as { password: unknown }).password).toBeNull();
      expect((patched?.body as { name: string }).name).toBe("Sofia Ferreira-Nunes");
    });
  });

  it("demande confirmation avant de supprimer, puis recharge la liste", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account()]) })
      .on("DELETE /users/11", { status: 204 });

    const user = userEvent.setup();
    renderWithAuth(<UserList />);

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));

    const dialog = screen.getByRole("dialog", { name: "Supprimer ce compte ?" });
    await user.click(
      within(dialog).getByRole("button", { name: "Supprimer définitivement" }),
    );

    await waitFor(() => {
      expect(api.calls.some((call) => call.method === "DELETE" && call.path === "/users/11")).toBe(
        true,
      );
    });
  });

  it("relaie le refus du backend plutôt que de le masquer", async () => {
    mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account()]) })
      .on("DELETE /users/11", {
        status: 409,
        body: {
          message: "Ce compte est le dernier administrateur.",
          error_code: "last_administrator",
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<UserList />);

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: "Supprimer définitivement" }));

    expect(await screen.findByText("Ce compte est le dernier administrateur.")).toBeInTheDocument();
  });

  it("ne propose pas de supprimer le compte avec lequel on est connecté", async () => {
    mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account({ id: ADMIN.id, name: ADMIN.name })]) });

    renderWithAuth(<UserList />);

    expect(await screen.findByRole("button", { name: "Supprimer" })).toBeDisabled();
    expect(screen.getByText("Votre compte")).toBeInTheDocument();
  });

  it("transmet le tri demandé à l'API", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: ADMIN } })
      .on("GET /roles", { body: { data: ROLES } })
      .on("GET /users", { body: paginated([account()]) });

    const user = userEvent.setup();
    renderWithAuth(<UserList />);

    await user.click(await screen.findByRole("button", { name: "Adresse e-mail" }));

    await waitFor(() => {
      expect(
        api.calls.some((call) => call.path.includes("sort=email") && call.path.includes("direction=asc")),
      ).toBe(true);
    });
  });
});
