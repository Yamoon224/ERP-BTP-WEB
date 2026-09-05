export type ClassValue = string | false | null | undefined | ClassValue[];

/**
 * Concatène des classes CSS conditionnelles en ignorant les valeurs vides.
 * Évite les `className={`a ${b ? "c" : ""}`}` et les espaces parasites.
 *
 * Les tableaux imbriqués sont aplatis : cela permet de regrouper les classes
 * d'un même état (« libellé au repos », « ligne active ») sous une seule
 * condition, au lieu de la répéter sur chaque classe.
 */
export function cn(...classes: ClassValue[]): string {
  const out: string[] = [];

  for (const entry of classes) {
    if (!entry) continue;
    if (Array.isArray(entry)) out.push(cn(...entry));
    else out.push(entry);
  }

  return out.filter(Boolean).join(" ");
}
