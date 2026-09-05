"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, FormAlert, PasswordField, TextField } from "@/components/ui";
import { IconArrowRight, IconException } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { errorMessage } from "@/lib/api-client";

export function LoginForm() {
  const { login, hasExpired } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (caught) {
      // Le backend renvoie déjà un message volontairement identique que le
      // compte existe ou non : on le relaie tel quel.
      setError(errorMessage(caught, "Connexion impossible."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* La session s'est refermée seule : le dire évite que l'utilisateur
          cherche ce qu'il a fait de travers. Masqué dès qu'une erreur de
          connexion s'affiche — deux bandeaux successifs se contrediraient. */}
      {hasExpired && error === null ? (
        <FormAlert tone="warning">
          Votre session a expiré. Reconnectez-vous pour reprendre où vous en étiez.
        </FormAlert>
      ) : null}

      <TextField
        label="Email"
        required
        type="email"
        name="email"
        autoComplete="username"
        placeholder="Email@domain.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <PasswordField
        label="Mot de passe"
        required
        name="***********"
        autoComplete="current-password"
        placeholder="Votre mot de passe"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
        >
          <IconException className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="mt-1 w-full"
        icon={<IconArrowRight className="h-4 w-4" />}
      >
        Se connecter
      </Button>
    </form>
  );
}
