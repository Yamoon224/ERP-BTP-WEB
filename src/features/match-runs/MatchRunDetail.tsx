"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  ErrorState,
  FormAlert,
  LinkButton,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { IconArrowRight, IconBilling, IconException, IconShield } from "@/components/ui/icons";
import { MatchLineResultsTable } from "@/features/invoices/MatchLineResultsTable";
import { MatchRunSummary } from "@/features/invoices/MatchRunSummary";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
} from "@/lib/domain-labels";
import { formatDateTime } from "@/lib/format";
import { matchingService } from "@/services";

/**
 * Une execution du moteur, telle qu'elle a ete archivee.
 *
 * L'ecran est en lecture seule de bout en bout : c'est une piece d'audit. Tout
 * ce qui s'y trouve — tolerances, taux, preuve ligne a ligne — a ete fige au
 * moment de la decision et ne bougera plus, meme si le bon de commande, les
 * livraisons ou la configuration changent ensuite. C'est precisement ce qui
 * rend la decision rejouable et contestable des annees plus tard.
 */
export function MatchRunDetail({ matchRunId }: { matchRunId: string }) {
  const loader = useCallback(() => matchingService.findRunById(matchRunId), [matchRunId]);
  const { data: run, isLoading, error, reload } = useAsyncData(loader);

  if (isLoading) return <LoadingState label="Chargement de l'exécution…" />;
  if (error || run === null) {
    return <ErrorState error={error ?? new Error("Exécution introuvable.")} onRetry={reload} />;
  }

  const exceptions = run.exceptions ?? [];

  return (
    <>
      <PageHeader
        title={`Rapprochement n°${run.id}`}
        description={
          run.invoice
            ? `Facture ${run.invoice.reference} — ${run.invoice.supplier?.name ?? "fournisseur inconnu"}`
            : `Facture #${run.invoice_id}`
        }
        icon={<IconShield className="h-5 w-5" />}
        actions={
          <>
            <LinkButton
              href={`/invoices/${run.invoice_id}`}
              icon={<IconBilling className="h-4 w-4" />}
            >
              Voir la facture
            </LinkButton>
            <LinkButton
              href="/match-runs"
              icon={<IconArrowRight className="h-4 w-4 rotate-180" />}
            >
              Retour au registre
            </LinkButton>
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <FormAlert tone="warning">
          Cette exécution est <strong>archivée définitivement</strong>. Pour obtenir un nouveau
          verdict, rejouez le rapprochement depuis la facture : une exécution supplémentaire sera
          créée, celle-ci restera consultable.
        </FormAlert>

        <MatchRunSummary run={run} currency={run.currency} />

        {run.line_results && run.line_results.length > 0 ? (
          <MatchLineResultsTable lineResults={run.line_results} currency={run.currency} />
        ) : null}

        <Card>
          <CardHeader
            icon={<IconException className="h-4 w-4" />}
            title="Écarts produits par cette exécution"
            description={
              exceptions.length === 0
                ? "Aucun écart : rien n'attendait d'arbitrage humain."
                : "Chaque écart bloque la portion de facture qu'il concerne jusqu'à décision humaine."
            }
            actions={
              exceptions.length > 0 ? (
                <Badge tone="warning">{exceptions.length}</Badge>
              ) : (
                <Badge tone="success">Aucun</Badge>
              )
            }
          />
          {exceptions.length > 0 ? (
            <CardBody className="flex flex-col gap-3">
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="rounded-sm border border-slate-200 px-4 py-3 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {exception.type_label}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {exception.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge tone={SEVERITY_TONE[exception.severity]}>
                        {SEVERITY_LABEL[exception.severity]}
                      </Badge>
                      <Badge tone={REVIEW_STATUS_TONE[exception.review_status]}>
                        {exception.review_status_label ??
                          REVIEW_STATUS_LABEL[exception.review_status]}
                      </Badge>
                    </div>
                  </div>

                  {exception.review_status !== "open" ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Arbitré par {exception.reviewed_by?.name ?? "—"} le{" "}
                      {formatDateTime(exception.reviewed_at)}
                      {exception.review_note ? ` — « ${exception.review_note} »` : null}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs">
                      <Link
                        href="/exceptions"
                        className="text-blue-700 hover:underline dark:text-blue-400"
                      >
                        Arbitrer dans la file de revue
                      </Link>
                    </p>
                  )}
                </div>
              ))}
            </CardBody>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            icon={<IconShield className="h-4 w-4" />}
            title="Contexte figé"
            description="Ce que le moteur avait sous les yeux au moment de décider."
          />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Identifiant d'exécution", value: `#${run.id}` },
                { label: "Version du moteur", value: run.engine_version },
                { label: "Horodatage", value: formatDateTime(run.evaluated_at) },
                { label: "Devise de règlement", value: run.currency },
                { label: "Devise de référence", value: run.base_currency },
                {
                  label: "Lignes évaluées",
                  value: run.line_results?.length ?? run.line_results_count ?? "—",
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
