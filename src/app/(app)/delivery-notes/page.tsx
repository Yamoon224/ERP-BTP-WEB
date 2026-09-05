import { PageHeader } from "@/components/ui";
import { IconDelivery } from "@/components/ui/icons";
import { DeliveryNoteList } from "@/features/delivery-notes/DeliveryNoteList";

export const metadata = { title: "Bons de livraison - ERP BTP" };

export default function DeliveryNotesPage() {
  return (
    <>
      <PageHeader
        title="Bons de livraison"
        description="Deuxième voie : ce qui est réellement arrivé. Seule une réception acceptée ouvre un droit à paiement."
        icon={<IconDelivery className="h-5 w-5" />}
      />
      <DeliveryNoteList />
    </>
  );
}
