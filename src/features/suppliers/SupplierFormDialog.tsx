"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button, FormAlert, Modal, SelectField, TextField } from "@/components/ui";
import { IconCheck } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { referenceService } from "@/services";
import type { SupplierInput } from "@/services/reference-service";
import type { Supplier } from "@/types/api";

/**
 * Creation et modification d'une fiche fournisseur.
 *
 * Le meme dialogue sert aux deux : les champs sont identiques, et deux
 * formulaires jumeaux finiraient par diverger sur un detail de validation.
 * Seuls le titre et l'action changent.
 */
export function SupplierFormDialog({
  supplier,
  isOpen,
  onClose,
  onSaved,
}: {
  /** `null` en creation. */
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = supplier !== null;

  const [code, setCode] = useState(supplier?.code ?? "");
  const [name, setName] = useState(supplier?.name ?? "");
  const [vatNumber, setVatNumber] = useState(supplier?.vat_number ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [isActive, setIsActive] = useState(supplier?.is_active ?? true);

  const action = useCallback(
    (input: SupplierInput) =>
      isEditing
        ? referenceService.updateSupplier(supplier.id, input)
        : referenceService.createSupplier(input),
    [isEditing, supplier],
  );

  const { run, isPending, error, fieldErrors } = useMutation(action);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = await run({
      code,
      name,
      vat_number: vatNumber === "" ? null : vatNumber,
      email: email === "" ? null : email,
      is_active: isActive,
    });

    if (result) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier ${supplier.name}` : "Créer un fournisseur"}
      description={
        isEditing
          ? "Le code identifie le fournisseur dans les documents déjà émis : le changer les rend plus difficiles à retrouver."
          : "Un fournisseur devient sélectionnable dans les bons de commande dès qu'il est actif."
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="supplier-form"
            isLoading={isPending}
            icon={<IconCheck className="h-4 w-4" />}
          >
            {isEditing ? "Enregistrer" : "Créer le fournisseur"}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Code"
            required
            placeholder="SUP-BETON"
            value={code}
            errors={fieldErrors.code}
            onChange={(event) => setCode(event.target.value)}
          />

          <TextField
            label="Raison sociale"
            required
            placeholder="Béton Express SAS"
            value={name}
            errors={fieldErrors.name}
            onChange={(event) => setName(event.target.value)}
          />

          <TextField
            label="Numéro de TVA"
            placeholder="FR12345678901"
            value={vatNumber}
            errors={fieldErrors.vat_number}
            onChange={(event) => setVatNumber(event.target.value)}
          />

          <TextField
            label="Adresse de facturation"
            type="email"
            placeholder="facturation@fournisseur.example"
            value={email}
            errors={fieldErrors.email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <SelectField
            label="État"
            value={isActive ? "1" : "0"}
            errors={fieldErrors.is_active}
            hint="Un fournisseur inactif disparaît des listes de saisie sans quitter l'historique."
            fieldClassName="sm:col-span-2"
            onChange={(event) => setIsActive(event.target.value === "1")}
          >
            <option value="1">Actif — sélectionnable dans les commandes</option>
            <option value="0">Inactif — conservé pour l&apos;historique</option>
          </SelectField>
        </div>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "L'enregistrement a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
