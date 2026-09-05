import { notFound } from "next/navigation";
import { PurchaseOrderDetail } from "@/features/purchase-orders/PurchaseOrderDetail";

export const metadata = { title: "Détail du bon de commande - ERP BTP" };

export default async function PurchaseOrderDetailPage(props: PageProps<"/purchase-orders/[id]">) {
  const { id } = await props.params;
  const purchaseOrderId = Number(id);

  if (!Number.isInteger(purchaseOrderId) || purchaseOrderId <= 0) notFound();

  return <PurchaseOrderDetail purchaseOrderId={purchaseOrderId} />;
}
