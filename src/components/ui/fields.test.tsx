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

  it("ne dessine qu'une seule bordure autour du contrôle", () => {
    render(<TextField label="Référence" placeholder="PO-2026-0001" />);

    const input = screen.getByLabelText("Référence");

    // Une seule ligne de contour, et elle est interieure. Un libelle flottant
    // pose sur la bordure haute devrait la masquer derriere un fond opaque ;
    // des que ce fond ne coincide pas avec celui du conteneur, le trait
    // reapparait et le champ semble en porter deux.
    expect(input.className).toContain("ring-1");
    expect(input.className).toContain("ring-inset");
    expect(input.className).toContain("border-0");
  });

  it("garde le placeholder visible à côté du libellé", () => {
    render(<TextField label="Quantité" placeholder="400" />);

    const input = screen.getByLabelText("Quantité");

    // Le libelle dit ce qu'on attend, le placeholder sous quelle forme : les
    // deux doivent rester lisibles en meme temps.
    expect(input.className).toContain("placeholder:text-slate-400");
    expect(input.className).not.toContain("placeholder:text-transparent");
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
