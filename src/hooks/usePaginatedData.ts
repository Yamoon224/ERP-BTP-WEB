"use client";

import { useCallback, useMemo, useState } from "react";
import { config } from "@/lib/config";
import { useAsyncData } from "./useAsyncData";
import type { Paginated } from "@/types/api";

export interface PaginatedState<T> {
  items: T[];
  meta: Paginated<T>["meta"] | null;
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  /** Change la taille de page et revient a la premiere : la page 7 d'un
   *  decoupage a 10 n'a pas d'equivalent dans un decoupage a 100. */
  setPerPage: (perPage: number) => void;
  isLoading: boolean;
  error: unknown;
  reload: () => void;
  /** Vrai uniquement une fois le chargement termine sans resultat. */
  isEmpty: boolean;
}

export interface PaginatedOptions {
  initialPage?: number;
  initialPerPage?: number;
}

/**
 * Liste paginee : pagination, taille de page, chargement, erreur et etat vide
 * en un seul endroit. Les ecrans de liste n'ont plus qu'a decrire leurs
 * colonnes.
 *
 * @param fetcher  Doit etre stable (useCallback) ; il recoit la page courante
 *                 et la taille de page demandee.
 */
export function usePaginatedData<T>(
  fetcher: (page: number, perPage: number) => Promise<Paginated<T>>,
  { initialPage = 1, initialPerPage = config.defaultPageSize }: PaginatedOptions = {},
): PaginatedState<T> {
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPageState] = useState(initialPerPage);

  const loader = useCallback(() => fetcher(page, perPage), [fetcher, page, perPage]);
  const { data, isLoading, error, reload } = useAsyncData(loader);

  const items = useMemo(() => data?.data ?? [], [data]);

  const setPerPage = useCallback((next: number) => {
    setPerPageState(next);
    setPage(1);
  }, []);

  return {
    items,
    meta: data?.meta ?? null,
    page,
    setPage,
    perPage,
    setPerPage,
    isLoading,
    error,
    reload,
    // Distinguer « rien a afficher » de « pas encore charge » : afficher un
    // message d'etat vide pendant le chargement serait trompeur.
    isEmpty: !isLoading && error === null && items.length === 0,
  };
}
