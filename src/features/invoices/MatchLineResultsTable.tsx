"use client";

import { useMemo, useState } from "react";
import { Badge, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconPurchaseOrder } from "@/components/ui/icons";
import { filterBySearch } from "@/lib/search";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE } from "@/lib/domain-labels";
import { formatMoney, formatQuantity, formatUnitPrice, formatVariance } from "@/lib/format";
import type { MatchLineResult } from "@/types/api";

/**
 * Détail ligne à ligne du rapprochement, avec la preuve chiffrée.
 *
 * Les trois quantités sont montrées côte à côte — commandée, reçue, facturée —
 * parce que c'est leur comparaison, et non le verdict seul, qui explique
 * pourquoi une portion n'est pas payable. Un contrôleur doit pouvoir refaire
 * le calcul de tête depuis cet écran.
 */
export function MatchLineResultsTable({
  lineResults,
  currency,
}: {
  lineResults: MatchLineResult[];
  currency: string;
}) {
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () =>
      filterBySearch(lineResults, search, (result) => [
        result.invoice_line?.description,
        result.evidence.item_code,
        result.status_label,
      ]),
    [lineResults, search],
  );

  const columns: Array<Column<MatchLineResult>> = [
    {
      key: "line",
      header: "Ligne",
      cell: (result) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {result.invoice_line?.description ?? `Ligne ${result.invoice_line_id}`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {result.evidence.item_code ? `Article ${result.evidence.item_code}` : "Hors bon de commande"}
          </p>
        </div>
      ),
    },
    {
      key: "quantities",
      header: "Commandé / Reçu / Facturé",
      className: "tabular-nums",
      cell: (result) => (
        <div className="text-xs leading-relaxed">
          <QuantityRow label="Commandé" value={result.evidence.quantity_ordered} />
          <QuantityRow label="Reçu" value={result.evidence.quantity_received} />
          <QuantityRow label="Facturé" value={result.quantity_invoiced} />
          {result.evidence.quantity_already_matched ? (
            <QuantityRow
              label="Déjà rapproché ailleurs"
              value={result.evidence.quantity_already_matched}
            />
          ) : null}
        </div>
      ),
    },
    {
      key: "prices",
      header: "Prix unitaire",
      className: "tabular-nums",
      cell: (result) => {
        const comparisonCurrency = result.evidence.comparison_currency ?? currency;
        const converted = result.evidence.unit_price_invoiced_in_comparison_currency;

        return (
        <div className="text-xs leading-relaxed">
          <p>
            <span className="text-slate-500 dark:text-slate-400">PO&nbsp;: </span>
            {result.unit_price_ordered === null
              ? "—"
              : formatUnitPrice(result.unit_price_ordered, comparisonCurrency)}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-400">Facturé&nbsp;: </span>
            {formatUnitPrice(result.unit_price_invoiced, currency)}
          </p>
          {/* Le prix converti est la valeur réellement comparée au PO : sans
              lui, l'écart affiché plus bas serait incompréhensible. */}
          {result.evidence.conversion_applied && converted !== undefined ? (
            <p className="text-slate-500 dark:text-slate-400">
              soit {formatUnitPrice(converted, comparisonCurrency)}
            </p>
          ) : null}
          {result.price_variance_ratio !== null && result.price_variance_ratio !== 0 ? (
            <p
              className={
                result.evidence.price_within_tolerance
                  ? "text-slate-500 dark:text-slate-400"
                  : "font-medium text-rose-700 dark:text-rose-400"
              }
            >
              Écart&nbsp;: {formatVariance(result.price_variance_ratio)}
            </p>
          ) : null}
        </div>
        );
      },
    },
    {
      key: "matched",
      header: "Rapproché",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (result) => (
        <div>
          <p className="font-medium">{formatMoney(result.matched_amount, currency)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatQuantity(result.quantity_matched)} / {formatQuantity(result.quantity_invoiced)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Verdict",
      cell: (result) => (
        <Badge tone={MATCH_STATUS_TONE[result.status]}>
          {result.status_label ?? MATCH_STATUS_LABEL[result.status]}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      title="Détail du rapprochement"
      description="Les chiffres ci-dessous sont ceux archivés au moment de la décision."
      icon={<IconPurchaseOrder className="h-4 w-4" />}
      columns={columns}
      rows={rows}
      getRowKey={(result) => result.id}
      emptyTitle="Aucune ligne rapprochée"
      emptyDescription={
        search !== "" ? "Aucune ligne ne correspond à cette recherche." : undefined
      }
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Rechercher un article, une ligne…",
        label: "Rechercher une ligne de rapprochement",
      }}
    />
  );
}

function QuantityRow({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined) return null;

  return (
    <p>
      <span className="text-slate-500 dark:text-slate-400">{label}&nbsp;: </span>
      {formatQuantity(value)}
    </p>
  );
}
