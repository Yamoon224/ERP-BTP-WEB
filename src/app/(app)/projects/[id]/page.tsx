import { notFound } from "next/navigation";
import { ProjectDetail } from "@/features/projects/ProjectDetail";

export const metadata = { title: "Fiche chantier - ERP BTP" };

export default async function ProjectDetailPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  return <ProjectDetail projectId={projectId} />;
}
