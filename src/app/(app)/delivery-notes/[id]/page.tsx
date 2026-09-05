import { notFound } from "next/navigation";
import { DeliveryNoteDetail } from "@/features/delivery-notes/DeliveryNoteDetail";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Détail du bon de livraison - ERP BTP" };

export default async function DeliveryNoteDetailPage(props: PageProps<"/delivery-notes/[id]">) {
  const { id } = await props.params;

  // Un identifiant qui n'a pas la forme d'un UUID ne peut designer
  // aucun bon de livraison : inutile d'aller le demander a l'API pour s'en
  // rendre compte.
  if (!isUuid(id)) notFound();

  return <DeliveryNoteDetail deliveryNoteId={id} />;
}
