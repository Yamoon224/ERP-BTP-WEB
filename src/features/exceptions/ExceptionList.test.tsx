import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { ExceptionList } from "./ExceptionList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated, testId } from "@/test/api-mock";
import type { MatchException, User } from "@/types/api";

function exception(overrides: Partial<MatchException> = {}): MatchException {
  return {
    id: testId(10),
    match_run_id: testId(5),
    invoice_id: testId(3),
    invoice_line_id: testId(7),
    type: "price_variance",
    type_label: "Écart de prix",
    severity: "medium",
    is_overridable: true,
    message: "Ligne 1 : prix unitaire facturé 612 contre 540 au bon de commande.",
    context: {},
    review_status: "open",
    review_status_label: "À arbitrer",
    review_note: null,
    reviewed_at: null,
    reviewed_by: null,
    invoice: {
      id: testId(3),
      reference: "FAC-2026-0003",
      status: "under_review",
      supplier: { id: testId(1), name: "Béton Express SAS" },
    },
    created_at: null,
    ...overrides,
  };
}

const CONTROLLER: User = {
  id: testId(5),
  name: "Nadia Belkacem",
  email: "controleur@erp.test",
  roles: ["controller"],
  permissions: ["matching.view", "matching.run", "matching.review", "payments.view"],
};

const ACCOUNTANT: User = {
  id: testId(6),
  name: "Julien Bardot",
  email: "comptable@erp.test",
  roles: ["accountant"],
  // Pas de `matching.review` : la separation des taches doit se voir dans l'UI.
  permissions: ["matching.view", "matching.run", "invoicing.manage"],
};

/**
 * Rend le composant dans un vrai AuthProvider : l'utilisateur courant vient de
 * la réponse simulée de `GET /me`, exactement comme en conditions réelles.
 */
function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("ExceptionList", () => {
  it("affiche les écarts ouverts avec leur contexte", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-exceptions", { body: paginated([exception()]) });

    renderWithAuth(<ExceptionList />);

    expect(await screen.findByText("Écart de prix")).toBeInTheDocument();
    expect(screen.getByText(/612 contre 540/)).toBeInTheDocument();
    expect(screen.getByText("FAC-2026-0003")).toBeInTheDocument();
  });

  it("propose d'arbitrer à un contrôleur", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-exceptions", { body: paginated([exception()]) });

    renderWithAuth(<ExceptionList />);

    expect(await screen.findByRole("button", { name: "Arbitrer" })).toBeInTheDocument();
  });

  it("masque l'arbitrage pour un comptable, qui n'a pas cette permission", async () => {
    mockApi()
      .on("GET /me", { body: { data: ACCOUNTANT } })
      .on("GET /match-exceptions", { body: paginated([exception()]) });

    renderWithAuth(<ExceptionList />);

    await screen.findByText("Écart de prix");
    expect(screen.queryByRole("button", { name: "Arbitrer" })).not.toBeInTheDocument();
  });

  it("envoie la décision et le motif, puis recharge la liste", async () => {
    const api = mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-exceptions", { body: paginated([exception()]) })
      .on(`POST /match-exceptions/${testId(10)}/review`, {
        body: {
          data: {
            exception: exception({ review_status: "approved", review_status_label: "Accepté" }),
            match_run: null,
          },
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<ExceptionList />);

    await user.click(await screen.findByRole("button", { name: "Arbitrer" }));

    await user.type(
      screen.getByLabelText(/Motif/),
      "Hausse contractuelle validée par le service achats.",
    );
    await user.click(screen.getByRole("button", { name: "Accepter" }));

    await waitFor(() => {
      const reviewCall = api.calls.find((call) => call.method === "POST");
      expect(reviewCall?.body).toEqual({
        decision: "approved",
        note: "Hausse contractuelle validée par le service achats.",
      });
    });

    // La liste est rechargée pour refléter le nouvel état.
    await waitFor(() => {
      const listCalls = api.calls.filter((call) => call.path.startsWith("/match-exceptions?"));
      expect(listCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("affiche l'erreur de validation renvoyée par le backend sous le champ concerné", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-exceptions", { body: paginated([exception()]) })
      .on(`POST /match-exceptions/${testId(10)}/review`, {
        status: 422,
        body: {
          message: "Données invalides.",
          error_code: "validation_failed",
          errors: { note: ["Un motif est obligatoire pour tracer la décision."] },
        },
      });

    const user = userEvent.setup();
    renderWithAuth(<ExceptionList />);

    await user.click(await screen.findByRole("button", { name: "Arbitrer" }));
    await user.type(screen.getByLabelText(/Motif/), "abc");
    await user.click(screen.getByRole("button", { name: "Accepter" }));

    expect(
      await screen.findByText("Un motif est obligatoire pour tracer la décision."),
    ).toBeInTheDocument();
  });

  it("avertit qu'un écart non dérogeable ne débloquera aucun paiement", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-exceptions", {
        body: paginated([
          exception({
            type: "supplier_mismatch",
            type_label: "Fournisseur non concordant",
            severity: "critical",
            is_overridable: false,
          }),
        ]),
      });

    const user = userEvent.setup();
    renderWithAuth(<ExceptionList />);

    await user.click(await screen.findByRole("button", { name: "Arbitrer" }));

    expect(screen.getByText("Non dérogeable")).toBeInTheDocument();
    expect(screen.getByText(/ne débloquera aucun paiement/)).toBeInTheDocument();
  });

  it("affiche l'auteur et le motif d'un arbitrage déjà rendu", async () => {
    mockApi()
      .on("GET /me", { body: { data: CONTROLLER } })
      .on("GET /match-exceptions", {
        body: paginated([
          exception({
            review_status: "rejected",
            review_status_label: "Refusé",
            review_note: "Prix non conforme au marché.",
            reviewed_at: "2026-09-02T09:15:00+00:00",
            reviewed_by: { id: testId(5), name: "Nadia Belkacem" },
          }),
        ]),
      });

    renderWithAuth(<ExceptionList />);

    expect(await screen.findByText("Refusé")).toBeInTheDocument();
    expect(screen.getByText(/Nadia Belkacem/)).toBeInTheDocument();
    expect(screen.getByText(/Prix non conforme au marché/)).toBeInTheDocument();
  });
});
