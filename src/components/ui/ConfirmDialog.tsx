"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { Modal } from "./Modal";
import { errorMessage } from "@/lib/api-client";

/**
 * Confirmation d'une action irreversible.
 *
 * Factorisee parce que le meme dialogue — titre, consequence expliquee,
 * message d'echec, bouton rouge — se repetait a l'identique sur chaque ecran
 * qui supprime quelque chose. Un refus metier (409) s'affiche ici plutot que
 * de disparaitre : c'est souvent la reponse la plus utile de l'ecran, celle
 * qui explique pourquoi la fiche ne peut pas partir.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirmer",
  confirmIcon,
  variant = "danger",
  isPending = false,
  error,
  errorFallback = "L'action a échoué.",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  /** Ce que l'action va reellement faire, en une phrase ou deux. */
  children: ReactNode;
  confirmLabel?: string;
  confirmIcon?: ReactNode;
  variant?: "danger" | "primary";
  isPending?: boolean;
  error?: unknown;
  errorFallback?: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="button"
            variant={variant}
            isLoading={isPending}
            onClick={onConfirm}
            icon={confirmIcon}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div>
        {error ? <FormAlert>{errorMessage(error, errorFallback)}</FormAlert> : null}
      </div>
    </Modal>
  );
}
