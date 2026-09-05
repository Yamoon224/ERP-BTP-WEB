"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TitleRule } from "./Card";
import { IconClose } from "./icons";

/**
 * Boite de dialogue basee sur <dialog> natif : le navigateur fournit deja le
 * piegeage du focus, la fermeture par Echap et le fond inerte. Les
 * reimplementer en JavaScript serait plus de code pour moins d'accessibilite.
 *
 * Le centrage est explicite (`fixed` + translation de 50 %) et non laisse au
 * defaut du navigateur : le reset de Tailwind remet `margin: 0` sur tous les
 * elements, y compris `<dialog>`, ce qui neutralise le `margin: auto` de la
 * feuille de style utilisateur-agent et colle la boite en haut a gauche.
 *
 * Sur mobile la boite occupe toute la largeur disponible et se colle au bas de
 * l'ecran : le pouce atteint les boutons du pied, et le clavier virtuel ne
 * pousse plus le formulaire hors du cadre.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Les formulaires de saisie a plusieurs lignes ont besoin de plus de large. */
  size?: "md" | "lg" | "xl";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const widthClass = {
    md: "sm:w-[min(38rem,calc(100vw-2rem))]",
    lg: "sm:w-[min(56rem,calc(100vw-2rem))]",
    xl: "sm:w-[min(72rem,calc(100vw-2rem))]",
  }[size];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-label={title}
      className={cn(
        // Mobile : plein cadre, ancre en bas. A partir de `sm` : boite centree.
        "fixed inset-x-0 bottom-0 top-auto max-h-[92dvh] w-full translate-x-0 translate-y-0",
        "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
        "sm:max-h-[calc(100dvh-2rem)]",
        widthClass,
        "flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-[var(--surface)] p-0 sm:rounded-sm",
        "text-slate-900 shadow-card backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm",
        "open:flex dark:border-slate-700 dark:text-slate-100",
      )}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <TitleRule />
          {description ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>

        {/* Fermeture explicite. Echap et le clic sur le voile existent deja,
            mais ni l'un ni l'autre ne se voit : sur mobile, la croix est le
            seul moyen visible de sortir. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          title="Fermer"
          className={cn(
            "-mr-1 -mt-1 shrink-0 rounded-sm p-2 text-slate-400 transition-colors",
            "hover:bg-slate-100 hover:text-slate-700",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
            "dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

      {footer ? (
        // En dessous de `sm`, les boutons passent en colonne inversee : l'action
        // principale se retrouve en haut de la pile, sous le pouce.
        <div
          className={cn(
            "flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3",
            "sm:flex-row sm:items-center sm:justify-end sm:px-5",
            "[&>button]:w-full sm:[&>button]:w-auto",
            "dark:border-slate-800",
          )}
        >
          {footer}
        </div>
      ) : null}
      <span aria-hidden="true" className="grad-brand block h-[3px] w-full shrink-0" />
    </dialog>
  );
}
