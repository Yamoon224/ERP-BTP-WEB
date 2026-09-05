"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button, FormAlert, Modal, SelectField, TextField } from "@/components/ui";
import { IconCheck } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { referenceService } from "@/services";
import type { ProjectInput } from "@/services/reference-service";
import type { Project } from "@/types/api";

/** Creation et modification d'un chantier — le meme formulaire pour les deux. */
export function ProjectFormDialog({
  project,
  isOpen,
  onClose,
  onSaved,
}: {
  /** `null` en creation. */
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = project !== null;

  const [code, setCode] = useState(project?.code ?? "");
  const [name, setName] = useState(project?.name ?? "");
  const [clientName, setClientName] = useState(project?.client_name ?? "");
  const [isActive, setIsActive] = useState(project?.is_active ?? true);

  const action = useCallback(
    (input: ProjectInput) =>
      isEditing
        ? referenceService.updateProject(project.id, input)
        : referenceService.createProject(input),
    [isEditing, project],
  );

  const { run, isPending, error, fieldErrors } = useMutation(action);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = await run({
      code,
      name,
      client_name: clientName === "" ? null : clientName,
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
      title={isEditing ? `Modifier ${project.name}` : "Créer un chantier"}
      description="Le chantier porte les engagements d'achat : c'est par lui que les montants se regroupent dans le pilotage."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="project-form"
            isLoading={isPending}
            icon={<IconCheck className="h-4 w-4" />}
          >
            {isEditing ? "Enregistrer" : "Créer le chantier"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Code chantier"
            required
            placeholder="CH-A12"
            value={code}
            errors={fieldErrors.code}
            onChange={(event) => setCode(event.target.value)}
          />

          <TextField
            label="Intitulé"
            required
            placeholder="Viaduc Nord"
            value={name}
            errors={fieldErrors.name}
            onChange={(event) => setName(event.target.value)}
          />

          <TextField
            label="Maître d'ouvrage"
            placeholder="Conseil Départemental"
            value={clientName}
            errors={fieldErrors.client_name}
            onChange={(event) => setClientName(event.target.value)}
          />

          <SelectField
            label="État"
            value={isActive ? "1" : "0"}
            errors={fieldErrors.is_active}
            hint="Un chantier clos reste lisible dans l'historique mais quitte les listes de saisie."
            onChange={(event) => setIsActive(event.target.value === "1")}
          >
            <option value="1">En cours — ouvert aux nouvelles commandes</option>
            <option value="0">Clos — conservé pour l&apos;historique</option>
          </SelectField>
        </div>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "L'enregistrement a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
