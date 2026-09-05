import { notFound } from "next/navigation";
import { ProjectDetail } from "@/features/projects/ProjectDetail";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Fiche chantier - ERP BTP" };

export default async function ProjectDetailPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;

  // Un identifiant qui n'a pas la forme d'un UUID ne peut designer
  // aucun chantier : inutile d'aller le demander a l'API pour s'en
  // rendre compte.
  if (!isUuid(id)) notFound();

  return <ProjectDetail projectId={id} />;
}
