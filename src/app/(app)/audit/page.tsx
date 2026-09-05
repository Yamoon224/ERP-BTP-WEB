import { PageHeader } from "@/components/ui";
import { IconShield } from "@/components/ui/icons";
import { AuditList } from "@/features/audit/AuditList";

export const metadata = { title: "Journal d'audit - ERP BTP" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Journal d'audit"
        description="Qui a changé quoi, quand, sur quel objet. En lecture seule pour tout le monde : un journal que l'on peut retoucher n'atteste de rien."
        icon={<IconShield className="h-5 w-5" />}
      />
      <AuditList />
    </>
  );
}
