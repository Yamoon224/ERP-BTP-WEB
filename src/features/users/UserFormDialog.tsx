"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Badge, Button, FormAlert, Modal, PasswordField, TextField } from "@/components/ui";
import { IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { roleLabel } from "@/lib/domain-labels";
import { userService } from "@/services";
import type { AdminUser, Role } from "@/types/api";

/**
 * Creation et modification d'un compte.
 *
 * Le meme formulaire sert aux deux, avec une difference qui compte : en
 * modification, un mot de passe vide veut dire « ne change rien » et non
 * « efface le mot de passe ». C'est le comportement attendu de tout ecran
 * d'administration, et le backend l'applique aussi de son cote.
 *
 * Les roles sont presentes avec ce qu'ils autorisent : « acheteur » ne dit
 * rien a qui ne connait pas le decoupage, « peut creer des bons de commande »
 * si. Attribuer un role a l'aveugle est la premiere cause de droits trop
 * larges.
 *
 * Le parent remonte le composant (via `key`) a chaque ouverture : l'etat part
 * donc du compte a editer des le premier rendu, sans effet de synchronisation
 * qui ecraserait une saisie en cours.
 */
export function UserFormDialog({
  user,
  isOpen,
  onClose,
  onSaved,
}: {
  /** `null` : creation. Sinon, modification du compte fourni. */
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = user !== null;

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<string[]>(user?.roles ?? []);

  const loadRoles = useCallback(() => userService.listRoles(), []);
  const { data: availableRoles } = useAsyncData<Role[]>(loadRoles);

  const action = useCallback(
    (input: { name: string; email: string; password: string | null; roles: string[] }) =>
      isEditing
        ? userService.update(user.id, input)
        : userService.create({ ...input, password: input.password ?? "" }),
    [isEditing, user],
  );

  const { run, isPending, error, fieldErrors } = useMutation(action);

  function toggleRole(role: string) {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = await run({
      name,
      email,
      password: password === "" ? null : password,
      roles,
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
      title={isEditing ? `Modifier ${user.name}` : "Créer un compte"}
      description={
        isEditing
          ? "Laissez le mot de passe vide pour le conserver."
          : "Le compte pourra se connecter dès sa création, avec les droits du ou des rôles choisis."
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="user-form"
            isLoading={isPending}
            disabled={roles.length === 0}
            icon={<IconCheck className="h-4 w-4" />}
          >
            {isEditing ? "Enregistrer" : "Créer le compte"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label="Nom affiché"
          required
          placeholder="Nadia Belkacem"
          value={name}
          errors={fieldErrors.name}
          onChange={(event) => setName(event.target.value)}
        />

        <TextField
          label="Adresse e-mail"
          required
          type="email"
          autoComplete="off"
          placeholder="prenom.nom@erp.test"
          value={email}
          errors={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <PasswordField
          label={isEditing ? "Nouveau mot de passe" : "Mot de passe"}
          required={!isEditing}
          autoComplete="new-password"
          placeholder={isEditing ? "Laisser vide pour ne pas changer" : "8 caractères minimum"}
          value={password}
          errors={fieldErrors.password}
          hint={isEditing ? "Vide, le mot de passe actuel est conservé." : "8 caractères minimum."}
          onChange={(event) => setPassword(event.target.value)}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Rôles<span className="ml-0.5 text-rose-500">*</span>
          </legend>

          {(availableRoles ?? []).map((role) => {
            const isSelected = roles.includes(role.name);

            return (
              <label
                key={role.name}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-sm border p-3 transition-colors",
                  isSelected
                    ? "grad-brand-soft border-blue-500 dark:border-blue-500"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRole(role.name)}
                  className="mt-1 accent-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    {roleLabel(role.name)}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} tone="neutral">
                        {permission}
                      </Badge>
                    ))}
                  </span>
                </span>
              </label>
            );
          })}

          {fieldErrors.roles ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {fieldErrors.roles.join(" ")}
            </p>
          ) : null}
        </fieldset>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "L'enregistrement du compte a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
