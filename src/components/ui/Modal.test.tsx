import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("est centré verticalement et horizontalement dans la fenêtre", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Arbitrer l'écart">
        <p>Contenu</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Arbitrer l'écart" });

    // Le reset de Tailwind remet `margin: 0` sur <dialog> et neutralise le
    // centrage de la feuille de style utilisateur-agent : il doit donc etre
    // porte explicitement, sur les deux axes.
    for (const className of ["left-1/2", "top-1/2", "-translate-x-1/2", "-translate-y-1/2"]) {
      expect(dialog.className).toContain(className);
    }
  });

  it("ne s'ouvre que sur demande", () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Arbitrer l'écart">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");

    rerender(
      <Modal isOpen onClose={vi.fn()} title="Arbitrer l'écart">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("rend son titre, son contenu et son pied", () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
        title="Régler la facture"
        description="Montant issu du rapprochement."
        footer={<button type="button">Confirmer</button>}
      >
        <p>Corps du dialogue</p>
      </Modal>,
    );

    expect(screen.getByRole("heading", { name: "Régler la facture" })).toBeInTheDocument();
    expect(screen.getByText("Montant issu du rapprochement.")).toBeInTheDocument();
    expect(screen.getByText("Corps du dialogue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmer" })).toBeInTheDocument();
  });
});
