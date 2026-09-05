import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@/test/api-mock";
import { DataTable } from "./DataTable";
import type { Column, SortState } from "./DataTable";

interface Row {
  id: string;
  reference: string;
  amount: number;
}

const ROWS: Row[] = [
  { id: testId(1), reference: "FAC-0001", amount: 120 },
  { id: testId(2), reference: "FAC-0002", amount: 80 },
];

const COLUMNS: Array<Column<Row>> = [
  { key: "reference", header: "Référence", sortKey: "reference", cell: (row) => row.reference },
  {
    key: "amount",
    header: "Montant",
    sortKey: "total",
    headerClassName: "text-right",
    cell: (row) => row.amount,
  },
  // Sans `sortKey` : une colonne d'actions n'a pas d'ordre qui veuille dire
  // quelque chose.
  { key: "actions", header: "Actions", cell: () => "—" },
];

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return render(
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      getRowKey={(row) => row.id}
      meta={{ current_page: 1, last_page: 1, per_page: 15, total: 2 }}
      onPageChange={vi.fn()}
      {...props}
    />,
  );
}

describe("DataTable", () => {
  it("rend les lignes et leurs colonnes", () => {
    renderTable();

    expect(screen.getByText("FAC-0001")).toBeInTheDocument();
    expect(screen.getByText("FAC-0002")).toBeInTheDocument();
  });

  it("ne rend les en-têtes cliquables que si le tri est pris en charge", () => {
    renderTable();

    // Sans `onSortChange`, aucun en-tete ne doit se presenter comme cliquable :
    // afficher un bouton qui ne fait rien est pire que pas de bouton.
    expect(screen.queryByRole("button", { name: /Trier par/ })).not.toBeInTheDocument();
  });

  it("demande un tri croissant au premier clic, décroissant au second", async () => {
    const onSortChange = vi.fn<(sort: SortState) => void>();
    const user = userEvent.setup();

    const { rerender } = renderTable({
      sort: { key: null, direction: "asc" },
      onSortChange,
    });

    await user.click(screen.getByRole("button", { name: "Référence" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "reference", direction: "asc" });

    rerender(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        meta={{ current_page: 1, last_page: 1, per_page: 15, total: 2 }}
        onPageChange={vi.fn()}
        sort={{ key: "reference", direction: "asc" }}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Référence" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "reference", direction: "desc" });
  });

  it("repart du croissant quand on change de colonne", async () => {
    const onSortChange = vi.fn<(sort: SortState) => void>();
    const user = userEvent.setup();

    renderTable({ sort: { key: "reference", direction: "desc" }, onSortChange });

    await user.click(screen.getByRole("button", { name: "Montant" }));

    // Heriter du sens de la colonne precedente donnerait un ordre invisible et
    // donc incomprehensible.
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "total", direction: "asc" });
  });

  it("annonce la colonne triée aux lecteurs d'écran", () => {
    renderTable({ sort: { key: "total", direction: "desc" }, onSortChange: vi.fn() });

    expect(screen.getByRole("columnheader", { name: /Montant/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByRole("columnheader", { name: /Référence/ })).toHaveAttribute(
      "aria-sort",
      "none",
    );
    // La colonne d'actions n'est pas triable : elle ne doit pas se declarer
    // « non triee », ce qui laisserait croire qu'elle pourrait l'etre.
    expect(screen.getByRole("columnheader", { name: "Actions" })).not.toHaveAttribute("aria-sort");
  });

  it("montre l'état vide plutôt qu'un tableau sans lignes", () => {
    renderTable({ rows: [], emptyTitle: "Aucun résultat" });

    expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("alterne le fond des lignes pour les suivre jusqu'au bout", () => {
    renderTable();

    const rows = within(screen.getByRole("table")).getAllByRole("row");
    // La premiere ligne du tableau est l'en-tete.
    expect(rows[1].className).toContain("odd:bg-[var(--surface)]");
    expect(rows[1].className).toContain("even:bg-slate-50/70");
    expect(rows[1].className).toContain("hover:bg-blue-50");
  });
});
