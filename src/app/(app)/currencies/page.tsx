import { PageHeader } from "@/components/ui";
import { IconBanknote } from "@/components/ui/icons";
import { CurrencyView } from "@/features/currencies/CurrencyView";

export const metadata = { title: "Devises et taux - ERP BTP" };

export default function CurrenciesPage() {
  return (
    <>
      <PageHeader
        title="Devises et taux de change"
        description="Un contrat peut être libellé dans une devise et réglé dans une autre. Le taux retenu est celui en vigueur à la date de la facture — et il est archivé avec la décision."
        icon={<IconBanknote className="h-5 w-5" />}
      />
      <CurrencyView />
    </>
  );
}
