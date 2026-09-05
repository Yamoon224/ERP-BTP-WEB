import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { ProjectList } from "./ProjectList";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockApi, paginated, testId } from "@/test/api-mock";
import type { Project, User } from "@/types/api";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: testId(3),
    code: "CH-A12",
    name: "Chantier A12 — Viaduc Nord",
    client_name: "Conseil Départemental",
    is_active: true,
    created_at: "2026-02-01T09:00:00+00:00",
    ...overrides,
  };
}

const BUYER: User = {
  id: testId(1),
  name: "Marc Lemoine",
  email: "acheteur@erp.test",
  roles: ["buyer"],
  permissions: ["procurement.view", "procurement.manage"],
};

function renderWithAuth(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("ProjectList", () => {
  it("bascule entre la vue en cartes et la vue en tableau", async () => {
    mockApi()
      .on("GET /me", { body: { data: BUYER } })
      .on("GET /projects", { body: paginated([project()]) });

    const user = userEvent.setup();
    renderWithAuth(<ProjectList />);

    // Par defaut, les cartes : on parcourt une liste de chantiers en cherchant
    // « celui du viaduc », pas en comparant des codes.
    expect(await screen.findByRole("listitem")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tableau" }));

    // Le tableau, lui, compare : c'est lui qui porte le tri par colonne.
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("affiche l'état du chantier dans les deux vues", async () => {
    mockApi()
      .on("GET /me", { body: { data: BUYER } })
      .on("GET /projects", { body: paginated([project({ is_active: false })]) });

    const user = userEvent.setup();
    renderWithAuth(<ProjectList />);

    const card = await screen.findByRole("listitem");
    expect(within(card).getByText("Clos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tableau" }));

    const row = await screen.findByRole("row", { name: /CH-A12/ });
    expect(within(row).getByText("Clos")).toBeInTheDocument();
  });
});
