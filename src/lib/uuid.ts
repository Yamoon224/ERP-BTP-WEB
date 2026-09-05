/**
 * Reconnaissance d'un identifiant de ressource.
 *
 * Toutes les cles de l'API sont des UUID. Verifier la forme avant d'appeler le
 * backend evite un aller-retour reseau pour apprendre ce que la chaine dit
 * deja : `/invoices/150` ne peut designer aucune facture, et la page peut
 * repondre « introuvable » immediatement.
 *
 * Le controle porte sur la forme, pas sur la version ni sur le variant : le
 * backend emet aujourd'hui des UUID v7, et rien ne doit casser le jour ou il
 * en emettra d'un autre type.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
