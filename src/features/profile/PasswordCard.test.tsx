import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordCard } from "./PasswordCard";
import { ProfileIdentityCard } from "./ProfileIdentityCard";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, testId } from "@/test/api-mock";
import type { User } from "@/types/api";

const CURRENT: User = {
  id: testId(6),
  name: "Julien Bardot",
  email: "comptable@erp.test",
  roles: ["accountant"],
  permissions: ["invoicing.manage"],
};

describe("PasswordCard", () => {
  it("exige l'ancien mot de passe et la confirmation", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: CURRENT } })
      .on("PUT /me/password", {
        body: { data: { message: "Mot de passe mis a jour." } },
      });

    const user = userEvent.setup();
    render(<PasswordCard />);

    await user.type(screen.getByLabelText(/Mot de passe actuel/), "ancien-mot-de-passe");
    await user.type(screen.getByLabelText(/^Nouveau mot de passe/), "nouveau-mot-de-passe");
    await user.type(screen.getByLabelText(/Confirmer/), "nouveau-mot-de-passe");

    await user.click(screen.getByRole("button", { name: /Mettre à jour le mot de passe/ }));

    await waitFor(() => {
      const sent = api.calls.find((call) => call.method === "PUT");
      expect(sent?.path).toBe("/me/password");
      // L'ancien mot de passe part avec le nouveau : sans lui, un jeton vole
      // suffirait a verrouiller le compte de sa victime.
      expect(sent?.body).toEqual({
        current_password: "ancien-mot-de-passe",
        password: "nouveau-mot-de-passe",
        password_confirmation: "nouveau-mot-de-passe",
      });
    });

    expect(await screen.findByText("Mot de passe mis a jour.")).toBeInTheDocument();
  });

  it("bloque l'envoi tant que la confirmation diffère", async () => {
    mockApi().on("GET /me", { body: { data: CURRENT } });

    const user = userEvent.setup();
    render(<PasswordCard />);

    await user.type(screen.getByLabelText(/Mot de passe actuel/), "ancien-mot-de-passe");
    await user.type(screen.getByLabelText(/^Nouveau mot de passe/), "nouveau-mot-de-passe");
    await user.type(screen.getByLabelText(/Confirmer/), "pas-la-meme-chose");

    expect(screen.getByRole("button", { name: /Mettre à jour le mot de passe/ })).toBeDisabled();
    expect(screen.getByText("Les deux saisies ne correspondent pas.")).toBeInTheDocument();
  });

  it("affiche l'erreur du backend sur un mot de passe actuel incorrect", async () => {
    mockApi()
      .on("GET /me", { body: { data: CURRENT } })
      .on("PUT /me/password", {
        status: 422,
        body: {
          message: "Les données fournies sont invalides.",
          error_code: "validation_failed",
          errors: { current_password: ["Le mot de passe actuel est incorrect."] },
        },
      });

    const user = userEvent.setup();
    render(<PasswordCard />);

    await user.type(screen.getByLabelText(/Mot de passe actuel/), "pas-le-bon");
    await user.type(screen.getByLabelText(/^Nouveau mot de passe/), "nouveau-mot-de-passe");
    await user.type(screen.getByLabelText(/Confirmer/), "nouveau-mot-de-passe");
    await user.click(screen.getByRole("button", { name: /Mettre à jour le mot de passe/ }));

    expect(await screen.findByText("Le mot de passe actuel est incorrect.")).toBeInTheDocument();
  });
});

describe("ProfileIdentityCard", () => {
  it("met à jour le nom et l'adresse, puis recharge la session", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: CURRENT } })
      .on("PATCH /me", { body: { data: { ...CURRENT, name: "Julien Bardot-Neveu" } } });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <ProfileIdentityCard user={CURRENT} />
      </AuthProvider>,
    );

    const nameField = screen.getByLabelText(/Nom affiché/);
    await user.clear(nameField);
    await user.type(nameField, "Julien Bardot-Neveu");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      const sent = api.calls.find((call) => call.method === "PATCH");
      expect(sent?.path).toBe("/me");
      // Ni role ni mot de passe : cet ecran ne sert qu'a se corriger soi-meme.
      expect(sent?.body).toEqual({ name: "Julien Bardot-Neveu", email: CURRENT.email });
    });
  });

  it("n'active le bouton que si quelque chose a changé", () => {
    mockApi().on("GET /me", { body: { data: CURRENT } });

    render(
      <AuthProvider>
        <ProfileIdentityCard user={CURRENT} />
      </AuthProvider>,
    );

    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });
});
