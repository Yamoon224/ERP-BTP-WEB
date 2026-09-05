import { PageHeader } from "@/components/ui";
import { IconUsers } from "@/components/ui/icons";
import { SupplierList } from "@/features/suppliers/SupplierList";

export const metadata = { title: "Fournisseurs - ERP BTP" };

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="Fournisseurs"
        description="Le référentiel d'où part tout le circuit : sans fournisseur, pas de bon de commande, donc pas de rapprochement possible."
        icon={<IconUsers className="h-5 w-5" />}
      />
      <SupplierList />
    </>
  );
}
