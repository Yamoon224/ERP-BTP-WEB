/**
 * Configuration lue depuis l'environnement.
 *
 * Regroupée ici pour qu'aucun composant n'aille chercher `process.env`
 * lui-même : une URL d'API en dur dans un composant est le genre de détail qui
 * ne se découvre qu'au premier déploiement en recette.
 */

const DEFAULT_API_URL = "http://localhost:8000/api";

export const config = {
  /** URL de base de l'API Laravel, sans slash final. */
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, ""),

  /** Clé de stockage du token d'authentification. */
  tokenStorageKey: "erp_auth_token",

  /** Taille de page par défaut des listes. */
  defaultPageSize: 15,
} as const;
