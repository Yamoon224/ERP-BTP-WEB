import { notFound } from "next/navigation";
import { MatchRunDetail } from "@/features/match-runs/MatchRunDetail";

export const metadata = { title: "Détail du rapprochement - ERP BTP" };

export default async function MatchRunDetailPage(props: PageProps<"/match-runs/[id]">) {
  const { id } = await props.params;
  const matchRunId = Number(id);

  if (!Number.isInteger(matchRunId) || matchRunId <= 0) notFound();

  return <MatchRunDetail matchRunId={matchRunId} />;
}
