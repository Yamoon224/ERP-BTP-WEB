"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: unknown;
  /** Relance la requête — après une mutation, par exemple. */
  reload: () => void;
}

/**
 * Charge une donnée asynchrone en gérant les trois états que tout écran doit
 * distinguer : chargement, erreur, donnée disponible.
 *
 * Conception : chaque requête est identifiée par un objet (`request`) recréé
 * dès que le chargeur ou le jeton de rechargement change, et le résultat
 * mémorisé transporte l'identité de la requête qui l'a produit. Deux
 * propriétés en découlent gratuitement :
 *
 *  - `isLoading` est **dérivé** (« le résultat en mémoire ne correspond pas à
 *    la requête courante ») plutôt que stocké. Un drapeau de chargement stocké
 *    finit toujours par se désynchroniser sur un cas limite ;
 *  - une réponse obsolète est ignorée : si l'utilisateur change de filtre avant
 *    la fin d'une requête, c'est la dernière demandée qui gagne, pas la
 *    dernière arrivée.
 *
 * @param loader  Fonction de chargement. Doit être stable (useCallback), sinon
 *                l'effet se relancerait à chaque rendu.
 */
export function useAsyncData<T>(loader: () => Promise<T>): AsyncState<T> {
  const [reloadToken, setReloadToken] = useState(0);

  // Identité de la requête courante : change avec le chargeur ou un rechargement.
  const request = useMemo(() => ({ loader, generation: reloadToken }), [loader, reloadToken]);

  const [result, setResult] = useState<{
    request: unknown;
    data: T | null;
    error: unknown;
  } | null>(null);

  useEffect(() => {
    let active = true;

    request
      .loader()
      .then((data) => {
        if (active) setResult({ request, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setResult({ request, data: null, error });
      });

    return () => {
      // Empêche l'écriture d'un état après démontage ou après invalidation.
      active = false;
    };
  }, [request]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const isCurrent = result !== null && result.request === request;

  return {
    // Tant que le résultat ne correspond pas à la requête courante, on ne sert
    // rien : afficher les données de l'ancien filtre serait pire que rien.
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    isLoading: !isCurrent,
    reload,
  };
}
