/**
 * Aides de test pour les chaînes produites par `Intl`.
 *
 * `Intl.NumberFormat` en français sépare les milliers par une espace fine
 * insécable (U+202F) et précède le symbole monétaire d'une insécable (U+00A0).
 * Ces caractères sont invisibles à la lecture d'un diff : les coder en dur dans
 * chaque assertion rendrait les tests fragiles et incompréhensibles. On les
 * ramène donc à une espace ordinaire, en un seul endroit.
 */
const INSECABLES = /[   ]/g;

export function normaliseSpaces(value: string): string {
  return value.replace(INSECABLES, " ");
}
