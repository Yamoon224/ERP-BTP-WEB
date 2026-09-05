"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readPreference, subscribePreference, writePreference } from "@/lib/preferences";

/**
 * Lit une préférence persistée et la tient à jour.
 *
 * Le rendu serveur — et la première passe d'hydratation — utilisent la valeur
 * par défaut : c'est le seul moyen d'éviter une divergence, le serveur n'ayant
 * aucun accès au stockage du navigateur. React réconcilie ensuite avec la
 * valeur réelle, et le script inline du thème a déjà évité tout clignotement.
 */
export function usePreference(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => subscribePreference(key, onChange),
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    useCallback(() => readPreference(key) ?? fallback, [key, fallback]),
    useCallback(() => fallback, [fallback]),
  );

  const setValue = useCallback((next: string) => writePreference(key, next), [key]);

  return [value, setValue];
}
