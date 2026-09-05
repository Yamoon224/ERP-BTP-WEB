import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { AuditList } from "./AuditList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated } from "@/test/api-mock";
import type { AuditLog, User } from "@/types/api";

const ENTRY: AuditLog = {
  id: 501,
  log_name: "default",
  description: "updated",
  event: "updated",
  event_label: "Modification",
  subject_type: "App\\Models\\Invoice",
  subject_label: "Facture",
  subject_id: 9,
  causer: { id: 4, name: "Julien Bardot" },
  causer_label: "Julien Bardot",
  properties: {
    attributes: { currency: "XOF", status: "under_review" },
    old: { currency: "EUR", status: "approved" },
  },
  created_at: "2026-09-04T10:00:00+00:00",
};

/** Une decision du moteur : personne ne l'a causee. */
const SYSTEM_ENTRY: AuditLog = {
  ...ENTRY,
  id: 502,
  causer: null,
  causer_label: "Systeme",
  properties: { attributes: { status: "approved" } },
};

const AUDITOR: User = {
  id: 1,
  name: "Nadia Belkacem",
  email: "controleur@erp.test",
  roles: ["controller"],
  permissions: ["audit.view"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("AuditList", () => {
  it("traduit le type d'objet et nomme l'auteur", async () => {
    mockApi()
      .on("GET /me", { body: { data: AUDITOR } })
      .on("GET /audit-logs/facets", { body: { data: { subject_types: [], events: [] } } })
      .on("GET /audit-logs", { body: paginated([ENTRY, SYSTEM_ENTRY]) });

    renderWithAuth(<AuditList />);

    const rows = await screen.findAllByRole("row", { name: /Facture/ });
    expect(within(rows[0]).getByText("Modification")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Julien Bardot")).toBeInTheDocument();

    // Une decision du moteur n'a pas d'auteur : l'afficher comme « Systeme »
    // plutot que vide evite de laisser croire a une information manquante.
    expect(within(rows[1]).getByText("Systeme")).toBeInTheDocument();
  });

  it("montre l'avant et l'après d'un changement", async () => {
    mockApi()
      .on("GET /me", { body: { data: AUDITOR } })
      .on("GET /audit-logs/facets", { body: { data: { subject_types: [], events: [] } } })
      .on("GET /audit-logs", { body: paginated([ENTRY]) });

    const user = userEvent.setup();
    renderWithAuth(<AuditList />);

    await user.click((await screen.findAllByRole("button", { name: "Détail" }))[0]);

    // Un journal qui n'affiche que « modifie » ne sert a rien : ce qui compte
    // est quelle valeur a remplace quelle autre.
    const dialog = screen.getByRole("dialog");
    const currencyRow = within(dialog).getByRole("row", { name: /currency/ });
    expect(within(currencyRow).getByText("EUR")).toBeInTheDocument();
    expect(within(currencyRow).getByText("XOF")).toBeInTheDocument();
  });

  it("annonce qu'il est en lecture seule et n'offre aucune écriture", async () => {
    mockApi()
      .on("GET /me", { body: { data: AUDITOR } })
      .on("GET /audit-logs/facets", { body: { data: { subject_types: [], events: [] } } })
      .on("GET /audit-logs", { body: paginated([ENTRY]) });

    renderWithAuth(<AuditList />);

    await screen.findAllByRole("row", { name: /Facture/ });

    expect(screen.getByRole("alert")).toHaveTextContent(/lecture seule/i);
    expect(screen.queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Modifier/ })).not.toBeInTheDocument();
  });
});
