import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  NetworkError,
  apiFetch,
  clearToken,
  errorMessage,
  onUnauthenticated,
  storeToken,
} from "./api-client";
import { config } from "./config";
import { mockApi, testId } from "@/test/api-mock";

describe("apiFetch", () => {
  beforeEach(() => {
    clearToken();
  });

  it("préfixe le chemin par l'URL d'API configurée", async () => {
    const api = mockApi().on("GET /invoices", { body: { data: [] } });

    await apiFetch("/invoices");

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(`${config.apiUrl}/invoices`);
    expect(api.calls[0]?.method).toBe("GET");
  });

  it("joint le token d'authentification quand il est présent", async () => {
    storeToken("token-de-test");
    const api = mockApi().on("GET /me", { body: { data: {} } });

    await apiFetch("/me");

    expect(api.calls[0]?.headers.get("Authorization")).toBe("Bearer token-de-test");
  });

  it("n'envoie aucun en-tête d'autorisation en l'absence de token", async () => {
    const api = mockApi().on("GET /me", { body: { data: {} } });

    await apiFetch("/me");

    expect(api.calls[0]?.headers.get("Authorization")).toBeNull();
  });

  it("sérialise le corps en JSON et pose le bon en-tête", async () => {
    const api = mockApi().on("POST /invoices", { status: 201, body: { data: { id: testId(1) } } });

    await apiFetch("/invoices", { method: "POST", body: { reference: "FAC-1" } });

    expect(api.calls[0]?.body).toEqual({ reference: "FAC-1" });
    expect(api.calls[0]?.headers.get("Content-Type")).toBe("application/json");
  });

  it("ignore les paramètres de requête vides plutôt que d'envoyer des filtres fantômes", async () => {
    const api = mockApi().on("GET /invoices", { body: { data: [] } });

    await apiFetch("/invoices", {
      query: { page: 2, status: "", supplier_id: undefined, search: null },
    });

    expect(api.calls[0]?.path).toBe("/invoices?page=2");
  });

  it("renvoie null pour un 204 sans corps", async () => {
    mockApi().on("POST /logout", { status: 204 });

    await expect(apiFetch("/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  describe("gestion des erreurs", () => {
    it("lève une ApiError portant le code applicatif du backend", async () => {
      mockApi().on("POST /invoices", {
        status: 409,
        body: { message: "Facture déjà soumise.", error_code: "duplicate_invoice", context: {} },
      });

      const error = await apiFetch("/invoices", { method: "POST", body: {} }).catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
      expect((error as ApiError).code).toBe("duplicate_invoice");
      expect((error as ApiError).message).toBe("Facture déjà soumise.");
    });

    it("expose les erreurs de validation par champ", async () => {
      mockApi().on("POST /invoices", {
        status: 422,
        body: {
          message: "Données invalides.",
          error_code: "validation_failed",
          errors: { "lines.0.quantity": ["La quantité doit être strictement positive."] },
        },
      });

      const error = (await apiFetch("/invoices", { method: "POST", body: {} }).catch(
        (e) => e,
      )) as ApiError;

      expect(error.fieldErrors["lines.0.quantity"]).toHaveLength(1);
    });

    it("distingue une absence d'authentification d'un refus de permission", async () => {
      mockApi().on("GET /a", { status: 401, body: { message: "x", error_code: "unauthenticated" } });
      const unauthenticated = (await apiFetch("/a").catch((e) => e)) as ApiError;

      mockApi().on("GET /b", { status: 403, body: { message: "y", error_code: "forbidden" } });
      const forbidden = (await apiFetch("/b").catch((e) => e)) as ApiError;

      expect(unauthenticated.isUnauthenticated).toBe(true);
      expect(unauthenticated.isForbidden).toBe(false);
      expect(forbidden.isForbidden).toBe(true);
      expect(forbidden.isUnauthenticated).toBe(false);
    });

    it("efface le token expiré et signale la fin de session", async () => {
      storeToken("token-expire");
      const notify = vi.fn();
      const unsubscribe = onUnauthenticated(notify);

      mockApi().on("GET /invoices", {
        status: 401,
        body: { message: "Non authentifié.", error_code: "unauthenticated" },
      });

      await apiFetch("/invoices").catch(() => null);

      expect(window.localStorage.getItem(config.tokenStorageKey)).toBeNull();
      expect(notify).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it("ne signale rien quand le 401 vient d'une requête sans token", async () => {
      const notify = vi.fn();
      const unsubscribe = onUnauthenticated(notify);

      mockApi().on("GET /me", {
        status: 401,
        body: { message: "Non authentifié.", error_code: "unauthenticated" },
      });

      await apiFetch("/me").catch(() => null);

      // Une visite anonyme n'est pas une session expirée : afficher « votre
      // session a expiré » a quelqu'un qui n'en a jamais ouvert serait faux.
      expect(notify).not.toHaveBeenCalled();

      unsubscribe();
    });

    it("distingue un serveur injoignable d'une réponse en erreur", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

      const error = await apiFetch("/invoices").catch((e) => e);

      expect(error).toBeInstanceOf(NetworkError);
      expect((error as NetworkError).message).toContain("backend");
    });
  });
});

describe("errorMessage", () => {
  it("relaie le message du backend", () => {
    const error = new ApiError(409, { message: "Facture annulée.", error_code: "invoice_cancelled" });

    expect(errorMessage(error)).toBe("Facture annulée.");
  });

  it("retombe sur le message par défaut pour une valeur inattendue", () => {
    expect(errorMessage(null, "Échec.")).toBe("Échec.");
    expect(errorMessage({ oops: true }, "Échec.")).toBe("Échec.");
  });
});
