import { PageHeader } from "@/components/ui";
import { IconShield } from "@/components/ui/icons";
import { MatchRunList } from "@/features/match-runs/MatchRunList";

export const metadata = { title: "Rapprochements - ERP BTP" };

export default function MatchRunsPage() {
  return (
    <>
      <PageHeader
        title="Rapprochements"
        description="Toutes les exécutions du moteur, du plus récent au plus ancien. Chacune archive qui a décidé, quand, avec quelles tolérances et sur quelle preuve — et aucune n'est jamais écrasée."
        icon={<IconShield className="h-5 w-5" />}
      />
      <MatchRunList />
    </>
  );
}
