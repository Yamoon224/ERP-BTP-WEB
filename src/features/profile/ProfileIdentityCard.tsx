"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, CardBody, CardHeader, FormAlert, TextField } from "@/components/ui";
import { IconCheck, IconUser } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { userService } from "@/services";
import type { ProfileInput } from "@/services/user-service";
import type { User } from "@/types/api";

/**
 * Modification par l'utilisateur de ses propres informations.
 *
 * Les roles n'y figurent pas, et ce n'est pas un oubli : personne ne
 * s'auto-promeut. Le backend ignore d'ailleurs toute cle `roles` envoyee sur
 * cette route — la garantie ne repose donc pas sur l'absence du champ dans ce
 * formulaire.
 *
 * Le compte est recu en propriete plutot que lu du contexte : le parent ne
 * rend cette carte qu'une fois la session verifiee, si bien que les champs
 * partent de la bonne valeur des le premier rendu. Un effet de
 * synchronisation aurait ecrase une saisie en cours au moindre
 * rafraichissement de la session.
 */
export function ProfileIdentityCard({ user }: { user: User }) {
  const { refresh } = useAuth();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSaved, setIsSaved] = useState(false);

  const action = useCallback((input: ProfileInput) => userService.updateProfile(input), []);
  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaved(false);
    reset();

    const updated = await run({ name, email });

    if (updated) {
      // Le nom et l'e-mail sont affiches dans l'en-tete et la barre laterale :
      // sans rafraichissement, l'ecran se contredirait lui-meme.
      await refresh();
      setIsSaved(true);
    }
  }

  const isUnchanged = name === user.name && email === user.email;

  return (
    <Card>
      <CardHeader
        title="Identité"
        description="Votre nom d'affichage et l'adresse avec laquelle vous vous connectez."
        icon={<IconUser className="h-4 w-4" />}
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Nom affiché"
            required
            placeholder="Nadia Belkacem"
            value={name}
            errors={fieldErrors.name}
            onChange={(event) => {
              setName(event.target.value);
              setIsSaved(false);
            }}
          />

          <TextField
            label="Adresse e-mail"
            required
            type="email"
            autoComplete="email"
            placeholder="prenom.nom@erp.test"
            value={email}
            errors={fieldErrors.email}
            hint="C'est cette adresse qui sert d'identifiant de connexion."
            onChange={(event) => {
              setEmail(event.target.value);
              setIsSaved(false);
            }}
          />

          {error && Object.keys(fieldErrors).length === 0 ? (
            <FormAlert>{errorMessage(error, "La mise à jour a échoué.")}</FormAlert>
          ) : null}

          {isSaved ? <FormAlert tone="success">Vos informations sont à jour.</FormAlert> : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isPending}
              disabled={isUnchanged}
              icon={<IconCheck className="h-4 w-4" />}
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
