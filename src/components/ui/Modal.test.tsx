import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("se centre sur grand écran et se colle en bas sur mobile", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Arbitrer l'écart">
        <p>Contenu</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Arbitrer l'écart" });

    // Le reset de Tailwind remet `margin: 0` sur <dialog> et neutralise le
    // centrage de la feuille de style utilisateur-agent : a partir de `sm`, il
    // doit donc etre porte explicitement, sur les deux axes.
    for (const className of [
      "sm:left-1/2",
      "sm:top-1/2",
      "sm:-translate-x-1/2",
      "sm:-translate-y-1/2",
    ]) {
      expect(dialog.className).toContain(className);
    }

    // En dessous de `sm`, la boite occupe toute la largeur et s'ancre en bas :
    // le pouce atteint le pied du dialogue, et le clavier virtuel ne pousse
    // plus le formulaire hors du cadre.
    for (const className of ["inset-x-0", "bottom-0", "w-full", "max-h-[92dvh]"]) {
      expect(dialog.className).toContain(className);
    }
  });

  it("offre une croix de fermeture visible", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={onClose} title="Arbitrer l'écart">
        <p>Contenu</p>
      </Modal>,
    );

    // Echap et le clic sur le voile existent deja, mais ni l'un ni l'autre ne
    // se voit : sur mobile, la croix est le seul moyen visible de sortir.
    await user.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalledOnce();
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
