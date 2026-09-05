import { PageHeader } from "@/components/ui";
import { IconPurchaseOrder } from "@/components/ui/icons";
import { PurchaseOrderList } from "@/features/purchase-orders/PurchaseOrderList";

export const metadata = { title: "Bons de commande - ERP BTP" };

export default async function PurchaseOrdersPage(props: PageProps<"/purchase-orders">) {
  // Permet d'arriver ici depuis une facture avec la reference du PO pre-filtree.
  const { search } = await props.searchParams;

  return (
    <>
      <PageHeader
        title="Bons de commande"
        description="Première voie du contrôle : ce qui a été engagé auprès du fournisseur, en quantité et en prix."
        icon={<IconPurchaseOrder className="h-5 w-5" />}
      />
      <PurchaseOrderList initialSearch={typeof search === "string" ? search : ""} />
    </>
  );
}
