import { PageHeader } from "@/components/ui";
import { IconException } from "@/components/ui/icons";
import { ExceptionList } from "@/features/exceptions/ExceptionList";

export const metadata = { title: "Écarts à arbitrer - ERP BTP" };

export default function ExceptionsPage() {
  return (
    <>
      <PageHeader
        title="Écarts à arbitrer"
        description="Le moteur n'accepte ni ne rejette un écart en silence : il le signale ici pour décision humaine, motif à l'appui."
        icon={<IconException className="h-5 w-5" />}
      />
      <ExceptionList />
    </>
  );
}
