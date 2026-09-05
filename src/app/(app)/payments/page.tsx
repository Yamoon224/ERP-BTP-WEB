import { PageHeader } from "@/components/ui";
import { IconPayment } from "@/components/ui/icons";
import { PaymentAuthorizationList } from "@/features/payments/PaymentAuthorizationList";

export const metadata = { title: "Autorisations de paiement - ERP BTP" };

export default function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Autorisations de paiement"
        description="Ce qui est payable aujourd'hui. Chaque montant est issu d'un rapprochement, jamais saisi à la main."
        icon={<IconPayment className="h-5 w-5" />}
      />
      <PaymentAuthorizationList />
    </>
  );
}
