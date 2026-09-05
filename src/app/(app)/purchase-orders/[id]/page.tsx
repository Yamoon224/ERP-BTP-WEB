import { notFound } from "next/navigation";
import { PurchaseOrderDetail } from "@/features/purchase-orders/PurchaseOrderDetail";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Détail du bon de commande - ERP BTP" };

export default async function PurchaseOrderDetailPage(props: PageProps<"/purchase-orders/[id]">) {
  const { id } = await props.params;

  // Un identifiant qui n'a pas la forme d'un UUID ne peut designer
  // aucun bon de commande : inutile d'aller le demander a l'API pour s'en
  // rendre compte.
  if (!isUuid(id)) notFound();

  return <PurchaseOrderDetail purchaseOrderId={id} />;
}
