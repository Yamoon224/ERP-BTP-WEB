"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TitleRule } from "./Card";

/**
 * Boite de dialogue basee sur <dialog> natif : le navigateur fournit deja le
 * piegeage du focus, la fermeture par Echap et le fond inerte. Les
 * reimplementer en JavaScript serait plus de code pour moins d'accessibilite.
 *
 * Le centrage est explicite (`fixed inset-0` + `m-auto`) et non laisse au
 * defaut du navigateur : le reset de Tailwind remet `margin: 0` sur tous les
 * elements, y compris `<dialog>`, ce qui neutralise le `margin: auto` de la
 * feuille de style utilisateur-agent et colle la boite en haut a gauche.
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
  size?: "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-label={title}
      className={cn(
        // Centrage vertical ET horizontal. La translation de 50 % est preferee
        // a `inset-0 + margin:auto` : cette derniere ne centre verticalement
        // qu'une boite de hauteur definie, alors qu'un dialogue se dimensionne
        // sur son contenu.
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "max-h-[calc(100dvh-2rem)] w-[min(100%,calc(100vw-2rem))]",
        size === "lg" ? "sm:w-[min(56rem,calc(100vw-2rem))]" : "sm:w-[min(38rem,calc(100vw-2rem))]",
        "flex-col overflow-hidden rounded-sm border border-slate-200 bg-[var(--surface)] p-0",
        "text-slate-900 shadow-card backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm",
        "open:flex dark:border-slate-700 dark:text-slate-100",
      )}
    >
      <div className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <TitleRule />
        {description ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {footer ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          {footer}
        </div>
      ) : null}
      <span aria-hidden="true" className="grad-brand block h-[3px] w-full shrink-0" />
    </dialog>
  );
}
