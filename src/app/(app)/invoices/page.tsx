import { PageHeader } from "@/components/ui";
import { IconBilling } from "@/components/ui/icons";
import { InvoiceList } from "@/features/invoices/InvoiceList";

export const metadata = { title: "Factures - ERP BTP" };

export default function InvoicesPage() {
  return (
    <>
      <PageHeader
        title="Factures"
        description="Troisième voie : ce qui est réclamé. Chaque facture est rapprochée dès sa soumission."
        icon={<IconBilling className="h-5 w-5" />}
      />
      <InvoiceList />
    </>
  );
}
