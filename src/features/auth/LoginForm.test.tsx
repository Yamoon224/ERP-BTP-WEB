import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
import { AuthProvider } from "./AuthContext";
import { config } from "@/lib/config";
import { mockApi, testId } from "@/test/api-mock";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const USER = {
  id: testId(5),
  name: "Nadia Belkacem",
  email: "controleur@erp.test",
  roles: ["controller"],
  permissions: ["matching.review"],
};

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("envoie les identifiants, stocke le token et redirige", async () => {
    const api = mockApi()
      .on("GET /me", { status: 401, body: { message: "Non authentifié.", error_code: "unauthenticated" } })
      .on("POST /login", { body: { data: { token: "token-123", user: USER } } });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/Email/), "controleur@erp.test");
    await user.type(screen.getByLabelText(/Mot de passe/), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      const loginCall = api.calls.find((call) => call.path === "/login");
      expect(loginCall?.body).toMatchObject({
        email: "controleur@erp.test",
        password: "password",
      });
    });

    await waitFor(() => {
      expect(window.localStorage.getItem(config.tokenStorageKey)).toBe("token-123");
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("affiche le message d'erreur du backend sans rediriger", async () => {
    mockApi()
      .on("GET /me", { status: 401, body: { message: "x", error_code: "unauthenticated" } })
      .on("POST /login", {
        status: 422,
        body: {
          message: "Identifiants invalides.",
          error_code: "validation_failed",
          errors: { email: ["Identifiants invalides."] },
        },
      });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/Email/), "inconnu@erp.test");
    await user.type(screen.getByLabelText(/Mot de passe/), "mauvais");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Identifiants invalides.");
    expect(replace).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(config.tokenStorageKey)).toBeNull();
  });

  it("signale un backend injoignable de façon actionnable", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/Email/), "a@b.test");
    await user.type(screen.getByLabelText(/Mot de passe/), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/backend/);
  });
});
