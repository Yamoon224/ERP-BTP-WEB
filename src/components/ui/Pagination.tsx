"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown, IconChevronLeft, IconChevronRight } from "./icons";

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

/**
 * Barre de pagination en trois zones, toujours dans le meme ordre :
 *
 *   Elements/Total  |  Precedent - Page/Pages - Suivant  |  Elements affiches
 *
 * A gauche la taille de page (combien on demande, sur combien il en existe),
 * au centre le deplacement, a droite le decompte reellement affiche. Chaque
 * zone repond a une question differente ; les melanger obligerait a relire la
 * ligne entiere pour retrouver un chiffre.
 */
export function Pagination({
  meta,
  onPageChange,
  onPerPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}) {
  const selectId = useId();

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  const shown = Math.max(to - from + 1, 0);

  // La taille de page courante peut venir du backend et sortir de la liste
  // proposee : on l'ajoute plutot que d'afficher un selecteur qui mentirait.
  const perPageOptions = PER_PAGE_OPTIONS.includes(meta.per_page)
    ? PER_PAGE_OPTIONS
    : [...PER_PAGE_OPTIONS, meta.per_page].sort((a, b) => a - b);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
    >
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          Éléments par page
        </label>
        <div className="relative">
          <select
            id={selectId}
            value={meta.per_page}
            disabled={!onPerPageChange}
            onChange={(event) => onPerPageChange?.(Number(event.target.value))}
            title="Éléments par page"
            className={cn(
              "appearance-none rounded-sm bg-[var(--surface)] py-1.5 pl-2.5 pr-7 text-xs font-medium tabular-nums",
              "text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors",
              "hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-600",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "dark:text-slate-200 dark:ring-slate-700 dark:hover:ring-blue-600",
            )}
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <IconChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          <span className="sr-only">Éléments par page sur un total de </span>
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <PageButton
          label="Précédent"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
          icon={<IconChevronLeft className="h-3.5 w-3.5" />}
        />
        <span
          aria-live="polite"
          className="min-w-16 rounded-sm px-2 py-1.5 text-center font-semibold tabular-nums text-slate-700 dark:text-slate-200"
        >
          {meta.current_page}/{meta.last_page}
        </span>
        <PageButton
          label="Suivant"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
          icon={<IconChevronRight className="h-3.5 w-3.5" />}
          iconFirst={false}
        />
      </div>

      <p className="tabular-nums text-slate-500 dark:text-slate-400">
        {shown} élément{shown > 1 ? "s" : ""} affiché{shown > 1 ? "s" : ""}
        <span className="hidden sm:inline">
          {" "}
          ({from}–{to})
        </span>
      </p>
    </nav>
  );
}

function PageButton({
  label,
  icon,
  disabled,
  onClick,
  iconFirst = true,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
  iconFirst?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2.5 py-1.5 font-medium transition-all duration-150",
        // Le degrade de marque : ce sont les deux seules commandes de la barre,
        // et rien d'autre ne doit se disputer le regard avec elles.
        "grad-brand text-white shadow-sm hover:grad-brand-hover hover:shadow-md active:translate-y-px",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        // Desactive, le bouton perd son degrade : un bouton bleu vif qui ne
        // repond pas est plus trompeur qu'un bouton visiblement eteint.
        "disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400",
        "disabled:shadow-none disabled:active:translate-y-0",
        "dark:disabled:bg-slate-800 dark:disabled:text-slate-500",
      )}
    >
      {iconFirst ? icon : null}
      <span className="hidden sm:inline">{label}</span>
      {iconFirst ? null : icon}
    </button>
  );
}
