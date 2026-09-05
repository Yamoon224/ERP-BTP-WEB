/**
 * Préférences d'interface persistées dans le navigateur (thème, barre latérale
 * repliée…).
 *
 * Ce sont des données qui vivent **hors de React** : le rendu serveur ne les
 * connaît pas, un autre onglet peut les modifier, et le stockage peut être
 * bloqué. Elles sont donc exposées comme un magasin externe abonnable, que les
 * composants lisent avec `useSyncExternalStore` — l'API prévue pour ça — plutôt
 * qu'en recopiant `localStorage` dans un état au montage, ce qui provoquerait
 * un rendu en cascade à chaque chargement de page.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function readPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Navigation privée ou stockage refusé : la préférence n'existe pas,
    // l'appelant retombera sur sa valeur par défaut.
    return null;
  }
}

export function writePreference(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sans persistance, le choix ne vaudra que pour l'onglet courant : les
    // abonnés sont notifiés quand même, sinon l'interface ne réagirait pas.
  }

  for (const listener of listeners.get(key) ?? []) listener();
}

export function subscribePreference(key: string, listener: Listener): () => void {
  const forKey = listeners.get(key) ?? new Set<Listener>();
  forKey.add(listener);
  listeners.set(key, forKey);

  // `storage` ne se déclenche que pour les *autres* onglets : c'est ce qui
  // garde deux fenêtres de l'application cohérentes entre elles.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    forKey.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
