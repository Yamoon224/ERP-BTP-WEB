import { notFound } from "next/navigation";
import { SupplierDetail } from "@/features/suppliers/SupplierDetail";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Fiche fournisseur - ERP BTP" };

export default async function SupplierDetailPage(props: PageProps<"/suppliers/[id]">) {
  const { id } = await props.params;

  // Un identifiant qui n'a pas la forme d'un UUID ne peut designer
  // aucune fiche fournisseur : inutile d'aller le demander a l'API pour s'en
  // rendre compte.
  if (!isUuid(id)) notFound();

  return <SupplierDetail supplierId={id} />;
}
