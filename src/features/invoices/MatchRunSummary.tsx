"use client";

import { Badge, Card, CardBody, CardHeader, DescriptionList } from "@/components/ui";
import { IconShield } from "@/components/ui/icons";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE, MATCH_TRIGGER_LABEL } from "@/lib/domain-labels";
import { formatDate, formatDateTime, formatExchangeRate, formatMoney, formatPercent } from "@/lib/format";
import type { MatchRun } from "@/types/api";

const RATE_SOURCE_LABEL: Record<string, string> = {
  fixed_peg: "parité fixe",
  manual: "saisie manuelle",
  provider: "fournisseur de cotations",
};

/**
 * Carte « qui a décidé quoi, quand, et sur quelle base ».
 *
 * C'est la traduction visible de l'exigence de traçabilité : l'auteur de la
 * décision, l'événement déclencheur, la version du moteur, les tolérances et —
 * lorsqu'une conversion est intervenue — le taux appliqué sont montrés
 * ensemble, parce que c'est l'ensemble, et non le seul montant, qui permet de
 * contester ou de justifier un règlement.
 */
export function MatchRunSummary({ run, currency }: { run: MatchRun; currency: string }) {
  const isSystem = run.decided_by.actor_type === "system";
  const conversion = run.exchange_rate_snapshot?.invoice_to_comparison;
  const baseConversion = run.exchange_rate_snapshot?.invoice_to_base;

  return (
    <Card>
      <CardHeader
        icon={<IconShield className="h-4 w-4" />}
        title="Dernier rapprochement"
        description={`Exécution n°${run.id}`}
        actions={<Badge tone={MATCH_STATUS_TONE[run.status]}>{run.status_label ?? MATCH_STATUS_LABEL[run.status]}</Badge>}
      />
      <CardBody className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AmountTile label="Facturé" value={formatMoney(run.invoiced_amount, currency)} />
          <AmountTile
            label="Autorisé au paiement"
            value={formatMoney(run.matched_amount, currency)}
            // La contre-valeur n'est affichée que si elle apporte une
            // information : répéter le même montant serait du bruit.
            secondary={
              baseConversion && run.base_currency !== run.currency
                ? `≈ ${formatMoney(run.base_matched_amount, run.base_currency)}`
                : undefined
            }
            tone="success"
          />
          <AmountTile
            label="Non rapproché"
            value={formatMoney(run.unmatched_amount, currency)}
            tone={run.unmatched_amount > 0 ? "danger" : "neutral"}
          />
        </div>

        {conversion ? (
          <div className="rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/50">
            <p className="font-medium text-blue-900 dark:text-blue-200">
              Conversion appliquée pour comparer les prix
            </p>
            <p className="mt-1 text-blue-800 dark:text-blue-300">
              1 {conversion.from} = {formatExchangeRate(conversion.rate)} {conversion.to}
              {" — "}
              {RATE_SOURCE_LABEL[conversion.source] ?? conversion.source}
              {conversion.effective_from ? `, en vigueur au ${formatDate(conversion.effective_from)}` : null}
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              Les prix sont confrontés dans la devise du bon de commande ; le règlement
              reste dû en {run.currency}.
            </p>
          </div>
        ) : null}

        <DescriptionList
          items={[
            {
              label: "Décidé par",
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  {run.decided_by.label}
                  <Badge tone={isSystem ? "neutral" : "info"}>
                    {isSystem ? "Automatique" : "Utilisateur"}
                  </Badge>
                </span>
              ),
            },
            { label: "Déclencheur", value: MATCH_TRIGGER_LABEL[run.trigger] ?? run.trigger },
            { label: "Horodatage", value: formatDateTime(run.evaluated_at) },
            { label: "Version du moteur", value: <code className="text-xs">{run.engine_version}</code> },
            {
              label: "Tolérance de prix appliquée",
              value: `${formatPercent(run.tolerance_snapshot.price_ratio)} ou ${formatMoney(
                run.tolerance_snapshot.price_absolute,
                run.tolerance_snapshot.currency,
              )} / unité`,
            },
            {
              label: "Tolérance de quantité appliquée",
              value: formatPercent(run.tolerance_snapshot.quantity_ratio),
            },
            {
              label: "Devise de facturation",
              value: `${run.currency} — règlement dû dans cette devise`,
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

function AmountTile({
  label,
  value,
  secondary,
  tone = "neutral",
}: {
  label: string;
  value: string;
  secondary?: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "danger"
        ? "text-rose-700 dark:text-rose-400"
        : "text-slate-900 dark:text-slate-100";

  return (
    <div className="rounded-sm bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70 dark:bg-slate-800/60 dark:ring-slate-700/60">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {secondary ? (
        <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">{secondary}</p>
      ) : null}
    </div>
  );
}
