import { PageHeader } from "@/components/ui";
import { IconCrane } from "@/components/ui/icons";
import { ProjectList } from "@/features/projects/ProjectList";

export const metadata = { title: "Chantiers - ERP BTP" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Chantiers"
        description="Les affaires sur lesquelles les achats sont engagés. C'est par le chantier que les montants se regroupent dans le pilotage."
        icon={<IconCrane className="h-5 w-5" />}
      />
      <ProjectList />
    </>
  );
}
