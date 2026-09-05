"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, CardHeader } from "./Card";
import { SearchInput } from "./Input";
import { IconSortAscending, IconSortDescending, IconSortNeutral } from "./icons";
import { Pagination } from "./Pagination";
import { EmptyState, ErrorState, LoadingState } from "./states";
import type { Paginated } from "@/types/api";

export type SortDirection = "asc" | "desc";

export interface SortState {
  /** Clé de tri courante, ou `null` quand l'ordre par défaut s'applique. */
  key: string | null;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Classes appliquées à la cellule — alignement des montants, notamment. */
  className?: string;
  headerClassName?: string;
  /**
   * Clé de tri envoyée à l'API pour cette colonne. Absente, la colonne n'est
   * pas triable : c'est le cas des colonnes d'actions et des colonnes
   * composites qu'aucun ordre SQL ne saurait reproduire fidèlement.
   */
  sortKey?: string;
}

export interface TableSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  getRowKey: (row: T) => string | number;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  meta?: Paginated<T>["meta"] | null;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  /** Champ de recherche affiché juste au-dessus du tableau. */
  search?: TableSearch;
  /** Tri courant ; fourni avec `onSortChange`, il rend les en-têtes cliquables. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Filtres complémentaires, alignés à droite de la recherche. */
  toolbar?: ReactNode;
  /** En-tête de carte, pour un tableau qui se suffit à lui-même. */
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Tableau de données générique : une seule implémentation porte le rendu, la
 * recherche, le tri, la pagination et les états de chargement / erreur / vide.
 *
 * C'est le composant qui évite la duplication la plus coûteuse du frontend —
 * sans lui, chaque écran de liste réécrirait sa propre gestion d'états, et ils
 * finiraient tous par se comporter légèrement différemment.
 *
 * Le tri est **délégué** : le tableau signale la colonne cliquée, l'écran la
 * transmet à l'API. Trier ici les quinze lignes affichées donnerait un ordre
 * qui change de sens à chaque page — le contraire de ce qu'attend quelqu'un
 * qui cherche le plus gros montant d'une liste de 150.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = "Aucun résultat",
  emptyDescription,
  meta,
  onPageChange,
  onPerPageChange,
  search,
  sort,
  onSortChange,
  toolbar,
  title,
  description,
  icon,
  actions,
  className,
}: DataTableProps<T>) {
  const showTable = !isLoading && !error && rows.length > 0;
  const showPagination = Boolean(meta && onPageChange && meta.total > 0);
  const isSortable = Boolean(onSortChange);

  function toggleSort(key: string) {
    if (!onSortChange) return;

    // Premier clic : croissant. Second clic sur la même colonne : décroissant.
    // Changer de colonne repart du croissant, parce qu'un ordre hérité de la
    // colonne précédente serait invisible et donc incompréhensible.
    const nextDirection: SortDirection =
      sort?.key === key && sort.direction === "asc" ? "desc" : "asc";

    onSortChange({ key, direction: nextDirection });
  }

  return (
    <Card className={className}>
      {title ? (
        <CardHeader title={title} description={description} icon={icon} actions={actions} />
      ) : null}

      {search || toolbar ? (
        // La recherche precede toujours le tableau et reste a gauche : c'est
        // le premier geste attendu devant une liste longue.
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-end md:justify-between dark:border-slate-800">
          {search ? (
            <div className="w-full md:max-w-xs">
              <SearchInput
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder ?? "Rechercher…"}
                label={search.label ?? "Rechercher dans le tableau"}
              />
            </div>
          ) : (
            <span className="hidden md:block" />
          )}
          {toolbar ? (
            <div className="flex flex-wrap items-end gap-3 md:justify-end">{toolbar}</div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? <LoadingState /> : null}
      {!isLoading && error ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}

      {showTable ? (
        // Le tableau défile horizontalement dans son propre conteneur : la page
        // elle-même ne doit jamais partir en scroll latéral.
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            {/* L'en-tete reprend le degrade de marque : c'est le meme repere
                visuel que le bouton d'action principale et le liseré des
                cartes, ce qui fait tenir l'interface d'un ecran a l'autre. */}
            <thead className="grad-brand text-white">
              <tr>
                {columns.map((column) => {
                  const sortKey = column.sortKey;
                  const canSort = isSortable && Boolean(sortKey);
                  const isSorted = canSort && sort?.key === sortKey;

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        isSorted
                          ? sort?.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : canSort
                            ? "none"
                            : undefined
                      }
                      className={cn(
                        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white",
                        column.headerClassName,
                      )}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(sortKey!)}
                          className={cn(
                            "group inline-flex w-full items-center gap-1.5 rounded-sm text-left uppercase",
                            "transition-colors hover:text-blue-100",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                            column.headerClassName?.includes("text-right") && "justify-end",
                          )}
                          title={`Trier par ${typeof column.header === "string" ? column.header.toLowerCase() : "cette colonne"}`}
                        >
                          <span>{column.header}</span>
                          <SortIcon
                            isSorted={Boolean(isSorted)}
                            direction={sort?.direction ?? "asc"}
                          />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  // Alternance de fond : sur un tableau large, l'oeil perd la
                  // ligne entre la premiere et la derniere colonne. Le survol
                  // passe au bleu de marque pour rester distinct de la rayure.
                  className={cn(
                    "border-b border-slate-100 transition-colors last:border-0",
                    "odd:bg-[var(--surface)] even:bg-slate-50/70",
                    "hover:bg-blue-50 dark:border-slate-800/70",
                    "dark:even:bg-slate-800/40 dark:hover:bg-blue-950/40",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 align-middle text-slate-700 dark:text-slate-300",
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showPagination && meta && onPageChange ? (
        <Pagination meta={meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} />
      ) : null}
    </Card>
  );
}

/**
 * Indicateur de tri. La colonne inactive garde une icone neutre, en retrait :
 * sans elle, rien ne signalerait qu'un en-tete est cliquable avant de l'avoir
 * survole.
 */
function SortIcon({ isSorted, direction }: { isSorted: boolean; direction: SortDirection }) {
  if (!isSorted) {
    return (
      <IconSortNeutral
        className="h-3.5 w-3.5 shrink-0 text-white/45 transition-opacity group-hover:text-white/80"
        aria-hidden="true"
      />
    );
  }

  return direction === "asc" ? (
    <IconSortAscending className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
  ) : (
    <IconSortDescending className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
  );
}
