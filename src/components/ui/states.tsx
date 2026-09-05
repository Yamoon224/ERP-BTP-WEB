import type { ReactNode } from "react";
import { errorMessage } from "@/lib/api-client";
import { Button } from "./Button";
import { IconException, IconRefresh, IconSearch } from "./icons";

/**
 * Les trois etats qu'un ecran de donnees doit savoir montrer, factorises ici
 * pour qu'ils se ressemblent partout : un utilisateur qui reconnait un ecran
 * vide au premier coup d'oeil ne perd pas de temps a se demander si l'appli a
 * plante.
 */

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-sm text-slate-500 dark:text-slate-400"
    >
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-5 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
        <IconException className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
        {errorMessage(error, "Le chargement a échoué.")}
      </p>
      {onRetry ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onRetry}
          icon={<IconRefresh className="h-3.5 w-3.5" />}
        >
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <IconSearch className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
