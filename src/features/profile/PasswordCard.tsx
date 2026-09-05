"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, CardBody, CardHeader, FormAlert, PasswordField } from "@/components/ui";
import { IconKey } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { userService } from "@/services";
import type { PasswordInput } from "@/services/user-service";

/**
 * Changement de mot de passe.
 *
 * L'ancien mot de passe est demande bien que la session soit deja ouverte :
 * sans lui, un jeton vole suffirait a verrouiller le compte de sa victime.
 * Les autres sessions sont fermees dans la foulee — un mot de passe change
 * parce qu'on le croit compromis ne protege de rien si les sessions ouvertes
 * ailleurs survivent.
 */
export function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const action = useCallback((input: PasswordInput) => userService.updatePassword(input), []);
  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    reset();

    const result = await run({
      current_password: currentPassword,
      password,
      password_confirmation: confirmation,
    });

    if (result) {
      setMessage(result);
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
    }
  }

  // La verification cote client sert le confort, pas la securite : le backend
  // refuse de toute facon une confirmation qui ne correspond pas.
  const mismatch = confirmation !== "" && confirmation !== password;

  return (
    <Card>
      <CardHeader
        title="Mot de passe"
        description="Changer votre mot de passe ferme vos autres sessions ; celle-ci reste ouverte."
        icon={<IconKey className="h-4 w-4" />}
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordField
            label="Mot de passe actuel"
            required
            autoComplete="current-password"
            placeholder="Votre mot de passe actuel"
            value={currentPassword}
            errors={fieldErrors.current_password}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />

          <PasswordField
            label="Nouveau mot de passe"
            required
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            value={password}
            errors={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <PasswordField
            label="Confirmer le nouveau mot de passe"
            required
            autoComplete="new-password"
            placeholder="Saisissez-le une seconde fois"
            value={confirmation}
            errors={mismatch ? ["Les deux saisies ne correspondent pas."] : undefined}
            onChange={(event) => setConfirmation(event.target.value)}
          />

          {error && Object.keys(fieldErrors).length === 0 ? (
            <FormAlert>{errorMessage(error, "Le changement de mot de passe a échoué.")}</FormAlert>
          ) : null}

          {message ? <FormAlert tone="success">{message}</FormAlert> : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isPending}
              disabled={mismatch || currentPassword === "" || password === ""}
              icon={<IconKey className="h-4 w-4" />}
            >
              Mettre à jour le mot de passe
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
