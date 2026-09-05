/**
 * Recherche textuelle cote client.
 *
 * Insensible a la casse **et aux accents** : sur un referentiel francais, un
 * utilisateur qui tape « beton » doit trouver « Béton Express ». Sans
 * normalisation, la recherche donnerait zero resultat sur une saisie pourtant
 * juste, ce qui est le pire des echecs silencieux.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Filtre des lignes sur la concatenation des champs juges pertinents. */
export function filterBySearch<T>(
  rows: T[],
  search: string,
  toSearchableText: (row: T) => Array<string | number | null | undefined>,
): T[] {
  const needle = normalizeText(search);
  if (needle === "") return rows;

  return rows.filter((row) =>
    normalizeText(
      toSearchableText(row)
        .filter((part) => part !== null && part !== undefined)
        .join(" "),
    ).includes(needle),
  );
}
