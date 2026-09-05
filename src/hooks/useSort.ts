"use client";

import { useCallback, useMemo, useState } from "react";
import type { SortState } from "@/components/ui";

export interface SortableState {
  sort: SortState;
  setSort: (sort: SortState) => void;
  /**
   * Parametres a transmettre tels quels au service. `undefined` quand aucun
   * tri n'est demande : le backend applique alors son ordre par defaut, qui
   * n'est pas toujours un tri de colonne (la file de revue met les ecarts
   * ouverts en tete).
   */
  sortParams: { sort?: string; direction?: "asc" | "desc" };
}

/**
 * Etat de tri d'une liste, sous la forme attendue par `DataTable` d'un cote et
 * par les services d'API de l'autre.
 *
 * Le tri est volontairement porte par l'ecran plutot que par le tableau : c'est
 * l'ecran qui parle a l'API, et trier les quinze lignes deja chargees
 * donnerait un ordre qui ne vaut que pour la page courante.
 */
export function useSort(initial: SortState = { key: null, direction: "asc" }): SortableState {
  const [sort, setSort] = useState<SortState>(initial);

  const sortParams = useMemo(
    () =>
      sort.key === null
        ? {}
        : { sort: sort.key, direction: sort.direction },
    [sort],
  );

  return { sort, setSort: useCallback((next: SortState) => setSort(next), []), sortParams };
}
