"use client";

import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur.
 *
 * Utilise pour les recherches servies par l'API : sans cela, « PO-2026 »
 * declencherait sept requetes, dont six deja obsoletes a leur arrivee.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
