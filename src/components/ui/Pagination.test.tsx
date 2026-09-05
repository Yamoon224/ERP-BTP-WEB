import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

const META = { current_page: 3, last_page: 12, per_page: 15, total: 175 };

describe("Pagination", () => {
  it("affiche les trois zones : taille de page, position, décompte", () => {
    render(<Pagination meta={META} onPageChange={vi.fn()} onPerPageChange={vi.fn()} />);

    // Taille de page / total
    expect(screen.getByLabelText("Éléments par page")).toHaveValue("15");
    expect(screen.getByText("/ 175")).toBeInTheDocument();

    // Position dans la pagination
    expect(screen.getByText("3/12")).toBeInTheDocument();

    // Décompte réellement affiché
    expect(screen.getByText(/15 éléments affichés/)).toBeInTheDocument();
    expect(screen.getByText(/31–45/)).toBeInTheDocument();
  });

  it("navigue vers la page suivante et la page précédente", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination meta={META} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole("button", { name: "Précédent" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("désactive les bornes plutôt que de laisser sortir de la plage", () => {
    const { rerender } = render(
      <Pagination meta={{ ...META, current_page: 1 }} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Précédent" })).toBeDisabled();

    rerender(<Pagination meta={{ ...META, current_page: 12 }} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });

  it("change la taille de page", async () => {
    const onPerPageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination meta={META} onPageChange={vi.fn()} onPerPageChange={onPerPageChange} />);

    await user.selectOptions(screen.getByLabelText("Éléments par page"), "50");

    expect(onPerPageChange).toHaveBeenCalledWith(50);
  });

  it("propose la taille de page renvoyée par l'API même hors de la liste standard", () => {
    render(<Pagination meta={{ ...META, per_page: 42 }} onPageChange={vi.fn()} />);

    // Un selecteur qui n'afficherait pas la valeur courante mentirait sur ce
    // que le backend a reellement applique.
    expect(screen.getByLabelText("Éléments par page")).toHaveValue("42");
  });

  it("n'annonce pas de sélecteur actif quand la taille de page n'est pas modifiable", () => {
    render(<Pagination meta={META} onPageChange={vi.fn()} />);

    expect(screen.getByLabelText("Éléments par page")).toBeDisabled();
  });
});
