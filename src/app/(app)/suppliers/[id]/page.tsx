import { notFound } from "next/navigation";
import { SupplierDetail } from "@/features/suppliers/SupplierDetail";

export const metadata = { title: "Fiche fournisseur - ERP BTP" };

export default async function SupplierDetailPage(props: PageProps<"/suppliers/[id]">) {
  const { id } = await props.params;
  const supplierId = Number(id);

  if (!Number.isInteger(supplierId) || supplierId <= 0) notFound();

  return <SupplierDetail supplierId={supplierId} />;
}
