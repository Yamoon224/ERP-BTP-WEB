"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Badge, Card, CardBody, CardHeader, ErrorState, LoadingState, StatCard } from "@/components/ui";
import {
  IconArrowRight,
  IconBilling,
  IconException,
  IconPayment,
  IconShield,
} from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  DISCREPANCY_TYPE_LABEL,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
} from "@/lib/domain-labels";
import { formatMoney } from "@/lib/format";
import { dashboardService } from "@/services";
import type { DiscrepancySeverity, DiscrepancyType, InvoiceStatus } from "@/types/api";

/**
 * Vue de pilotage du contrôle : ce qui est payable, ce qui est bloqué, et ce
 * qui attend une décision humaine.
 *
 * Ces trois chiffres répondent à la seule question qui compte pour un
 * responsable financier : « combien puis-je payer aujourd'hui sans risque, et
 * qu'est-ce qui m'en empêche pour le reste ».
 */
export function DashboardOverview() {
  const loader = useCallback(() => dashboardService.summary(), []);
  const { data, isLoading, error, reload } = useAsyncData(loader);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return null;

  const { amounts, exceptions, invoices } = data;
  const totalInvoices = Object.values(invoices).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Autorisé au paiement"
          value={formatMoney(amounts.authorized_for_payment, amounts.currency)}
          hint={
            amounts.by_currency.length > 1
              ? "Contre-valeur en devise de référence, toutes devises confondues"
              : "Portion couverte par un bon de commande et une réception acceptée"
          }
          tone="success"
          icon={<IconShield className="h-5 w-5" />}
        />
        <StatCard
          label="Bloqué"
          value={formatMoney(amounts.blocked, amounts.currency)}
          hint="Facturé sans contrepartie livrée ou à un prix non conforme"
          tone="danger"
          icon={<IconPayment className="h-5 w-5" />}
        />
        <StatCard
          label="Écarts à arbitrer"
          value={exceptions.open}
          hint="En attente d'une décision humaine"
          tone={exceptions.open > 0 ? "warning" : "neutral"}
          icon={<IconException className="h-5 w-5" />}
        />
        <StatCard
          label="Factures suivies"
          value={totalInvoices}
          hint="Tous statuts confondus"
          icon={<IconBilling className="h-5 w-5" />}
        />
      </div>

      {/* La ventilation par devise n'apparaît que si plusieurs devises sont
          effectivement en jeu : sur un circuit mono-devise, elle n'apporterait
          rien qu'un bloc vide. */}
      {amounts.by_currency.length > 1 ? (
        <Card>
          <CardHeader
            icon={<IconPayment className="h-4 w-4" />}
            title="Autorisé par devise de règlement"
            description="Les virements partent dans la devise de facturation ; la contre-valeur ne sert qu'au pilotage."
          />
          <CardBody>
            <ul className="flex flex-col gap-2">
              {amounts.by_currency.map((entry) => (
                <li
                  key={entry.currency}
                  className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Badge tone="neutral">{entry.currency}</Badge>
                    <span className="font-medium tabular-nums">
                      {formatMoney(entry.amount, entry.currency)}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    ≈ {formatMoney(entry.base_amount, amounts.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Factures par statut" icon={<IconBilling className="h-4 w-4" />} />
          <CardBody>
            <ul className="flex flex-col gap-2">
              {(Object.entries(invoices) as Array<[InvoiceStatus, number]>).map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Badge tone={INVOICE_STATUS_TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>
                  <span className="text-sm font-medium tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<IconException className="h-4 w-4" />}
            title="Écarts ouverts"
            description={
              exceptions.open === 0 ? "Aucun écart en attente." : undefined
            }
            actions={
              exceptions.open > 0 ? (
                <Link
                  href="/exceptions"
                  className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                >
                  Ouvrir la file de revue
                  <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null
            }
          />
          {exceptions.open > 0 ? (
            <CardBody className="flex flex-col gap-5">
              <BreakdownList
                title="Par gravité"
                entries={Object.entries(exceptions.by_severity) as Array<[DiscrepancySeverity, number]>}
                render={(severity) => (
                  <Badge tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</Badge>
                )}
              />
              <BreakdownList
                title="Par type"
                entries={Object.entries(exceptions.by_type) as Array<[DiscrepancyType, number]>}
                render={(type) => (
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {DISCREPANCY_TYPE_LABEL[type]}
                  </span>
                )}
              />
            </CardBody>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function BreakdownList<T extends string>({
  title,
  entries,
  render,
}: {
  title: string;
  entries: Array<[T, number]>;
  render: (key: T) => React.ReactNode;
}) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {entries.map(([key, count]) => (
          <li key={key} className="flex items-center justify-between gap-3">
            {render(key)}
            <span className="text-sm font-medium tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
