import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField, SelectField, TextField } from "./fields";

describe("Champs de formulaire", () => {
  it("lie le libellé au contrôle et expose un placeholder", () => {
    render(
      <TextField label="Adresse e-mail" placeholder="prenom.nom@entreprise.fr" type="email" />,
    );

    const input = screen.getByLabelText("Adresse e-mail");
    expect(input).toHaveAttribute("placeholder", "prenom.nom@entreprise.fr");
    expect(input).toHaveAttribute("type", "email");
  });

  it("signale les champs obligatoires et annonce les erreurs au lecteur d'écran", () => {
    render(
      <TextField
        label="Référence"
        placeholder="PO-2026-0001"
        required
        errors={["La référence est déjà utilisée."]}
      />,
    );

    const input = screen.getByLabelText(/Référence/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    // Le message doit etre rattache au champ, pas seulement affiche a cote.
    expect(input).toHaveAccessibleDescription("La référence est déjà utilisée.");
  });

  it("masque le mot de passe par défaut et permet de l'afficher en clair", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Mot de passe" placeholder="Votre mot de passe" />);

    const input = screen.getByLabelText("Mot de passe");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "afficher le mot de passe en clair" }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "masquer le mot de passe en clair" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("ne dessine qu'une seule bordure, portee par le contour et non par le controle", () => {
    const { container } = render(<TextField label="Référence" placeholder="PO-2026-0001" />);

    const input = screen.getByLabelText("Référence");

    // Le contour est dessine par un <fieldset> pose par-dessus le controle, et
    // sa <legend> decoupe un vrai trou dans le trait quand le libelle monte.
    // Le controle lui-meme ne porte donc AUCUNE bordure : c'est ce qui rend le
    // « double trait » impossible, quel que soit le fond du conteneur.
    expect(input).toHaveClass("field-control");
    expect(input.className).not.toContain("ring-1");
    expect(input.className).not.toContain("border");

    const outlines = container.querySelectorAll("fieldset.field-outline");
    expect(outlines).toHaveLength(1);
    // La legende reprend le libelle : c'est elle qui dimensionne l'encoche.
    expect(outlines[0].querySelector("legend")).toHaveTextContent("Référence");
  });

  it("fait flotter le libelle au-dessus du controle", () => {
    const { container } = render(<TextField label="Quantité" placeholder="400" />);

    const input = screen.getByLabelText("Quantité");
    const label = container.querySelector("label.field-label");

    // Le libelle est pose dans le champ tant qu'il est vide, et monte sur la
    // bordure des la saisie ou le focus. Le placeholder reste declare : c'est
    // lui qui alimente `:placeholder-shown`, la pseudo-classe qui declenche la
    // montee. Sans lui, le libelle resterait au centre d'un champ rempli.
    expect(label).toHaveTextContent("Quantité");
    expect(input).toHaveAttribute("placeholder", "400");
    expect(input).toHaveClass("field-control");
  });

  it("rend un select accessible par son libellé", async () => {
    const user = userEvent.setup();
    render(
      <SelectField label="Statut" defaultValue="">
        <option value="">Tous les statuts</option>
        <option value="approved">Approuvée</option>
      </SelectField>,
    );

    await user.selectOptions(screen.getByLabelText("Statut"), "approved");

    expect(screen.getByLabelText("Statut")).toHaveValue("approved");
  });
});
