import { notFound } from "next/navigation";
import { DeliveryNoteDetail } from "@/features/delivery-notes/DeliveryNoteDetail";

export const metadata = { title: "Détail du bon de livraison - ERP BTP" };

export default async function DeliveryNoteDetailPage(props: PageProps<"/delivery-notes/[id]">) {
  const { id } = await props.params;
  const deliveryNoteId = Number(id);

  if (!Number.isInteger(deliveryNoteId) || deliveryNoteId <= 0) notFound();

  return <DeliveryNoteDetail deliveryNoteId={deliveryNoteId} />;
}
