import { PageHeader } from "@/components/ui";
import { IconDashboard } from "@/components/ui/icons";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";

export const metadata = { title: "Tableau de bord - ERP BTP" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="État du contrôle à 3 voies : ce qui est payable, ce qui est bloqué, et ce qui attend un arbitrage."
        icon={<IconDashboard className="h-5 w-5" />}
      />
      <DashboardOverview />
    </>
  );
}
