import { notFound } from "next/navigation";
import { MatchRunDetail } from "@/features/match-runs/MatchRunDetail";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Détail du rapprochement - ERP BTP" };

export default async function MatchRunDetailPage(props: PageProps<"/match-runs/[id]">) {
  const { id } = await props.params;

  // Un identifiant qui n'a pas la forme d'un UUID ne peut designer
  // aucune execution : inutile d'aller le demander a l'API pour s'en
  // rendre compte.
  if (!isUuid(id)) notFound();

  return <MatchRunDetail matchRunId={id} />;
}
