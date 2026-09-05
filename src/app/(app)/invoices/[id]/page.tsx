import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/features/invoices/InvoiceDetail";

export const metadata = { title: "Détail de la facture - ERP BTP" };

/**
 * `PageProps` est le type genere par Next pour cette route : il valide le
 * chemin lui-meme, si bien qu'un renommage de dossier casse la compilation
 * plutot que la navigation en production.
 */
export default async function InvoiceDetailPage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;
  const invoiceId = Number(id);

  // Un identifiant non numerique ne peut correspondre a aucune facture :
  // inutile d'aller le demander a l'API pour s'en rendre compte.
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) notFound();

  return <InvoiceDetail invoiceId={invoiceId} />;
}
