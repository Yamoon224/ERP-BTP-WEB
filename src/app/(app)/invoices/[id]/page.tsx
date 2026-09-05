import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/features/invoices/InvoiceDetail";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Détail de la facture - ERP BTP" };

/**
 * `PageProps` est le type genere par Next pour cette route : il valide le
 * chemin lui-meme, si bien qu'un renommage de dossier casse la compilation
 * plutot que la navigation en production.
 */
export default async function InvoiceDetailPage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;

  // Un identifiant qui n'a pas la forme d'un UUID ne peut designer
  // aucune facture : inutile d'aller le demander a l'API pour s'en
  // rendre compte.
  if (!isUuid(id)) notFound();

  return <InvoiceDetail invoiceId={id} />;
}
