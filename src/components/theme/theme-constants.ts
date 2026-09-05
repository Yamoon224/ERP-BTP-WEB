/**
 * Constantes du thème, isolées dans un module **sans** directive client.
 *
 * `ThemeProvider` est un composant client ; les valeurs exportées par un
 * module « use client » ne sont pas de vraies valeurs côté serveur, mais des
 * références. Le script anti-clignotement, lui, est rendu par le layout
 * serveur et a besoin de la vraie clé de stockage : la partager depuis un
 * module neutre est la seule façon d'en garantir une seule définition.
 */
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "erp_theme";

/** Thème par défaut, avant tout choix : clair. */
export const DEFAULT_THEME: Theme = "light";

export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: string): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}
