"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Badge, Button, DataTable, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconGavel } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { filterBySearch } from "@/lib/search";
import {
  DISCREPANCY_TYPE_LABEL,
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
} from "@/lib/domain-labels";
import { formatDateTime } from "@/lib/format";
import { matchingService } from "@/services";
import type { MatchException, ReviewStatus } from "@/types/api";
import { ExceptionReviewDialog } from "./ExceptionReviewDialog";

const STATUS_OPTIONS: Array<{ value: ReviewStatus | ""; label: string }> = [
  { value: "open", label: "À arbitrer" },
  { value: "approved", label: "Acceptés" },
  { value: "rejected", label: "Refusés" },
  { value: "", label: "Tous" },
];

/**
 * File de revue humaine.
 *
 * Par défaut, seuls les écarts ouverts sont affichés : cet écran sert d'abord
 * à traiter ce qui bloque des paiements, l'historique n'est qu'un second usage.
 */
export function ExceptionList({ invoiceId }: { invoiceId?: string } = {}) {
  const { can } = useAuth();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | "">("open");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MatchException | null>(null);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      matchingService.listExceptions({
        page,
        per_page: perPage,
        invoice_id: invoiceId,
        review_status: reviewStatus || undefined,
        ...sortParams,
      }),
    [invoiceId, reviewStatus, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<MatchException>(fetcher);

  // L'API des ecarts ne propose pas de recherche plein texte : le filtre
  // s'applique donc a la page chargee, et le champ le dit explicitement plutot
  // que de laisser croire a une recherche sur toute la file.
  const rows = useMemo(
    () =>
      filterBySearch(items, search, (exception) => [
        exception.type_label,
        exception.message,
        exception.invoice?.reference,
        exception.invoice?.supplier?.name,
        exception.review_note,
        exception.reviewed_by?.name,
      ]),
    [items, search],
  );

  const canReview = can("matching.review");

  const columns: Array<Column<MatchException>> = [
    {
      key: "type",
      header: "Écart",
      sortKey: "type",
      cell: (exception) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {exception.type_label ?? DISCREPANCY_TYPE_LABEL[exception.type]}
          </p>
          <p className="mt-0.5 max-w-lg text-xs text-slate-500 dark:text-slate-400">
            {exception.message}
          </p>
        </div>
      ),
    },
    {
      key: "invoice",
      header: "Facture",
      sortKey: "invoice",
      cell: (exception) =>
        exception.invoice ? (
          <div>
            <Link
              href={`/invoices/${exception.invoice.id}`}
              className="font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              {exception.invoice.reference}
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {exception.invoice.supplier?.name ?? "—"}
            </p>
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "severity",
      header: "Gravité",
      sortKey: "severity",
      cell: (exception) => (
        <Badge tone={SEVERITY_TONE[exception.severity]}>{SEVERITY_LABEL[exception.severity]}</Badge>
      ),
    },
    {
      key: "review",
      header: "Arbitrage",
      sortKey: "review_status",
      cell: (exception) => (
        <div>
          <Badge tone={REVIEW_STATUS_TONE[exception.review_status]}>
            {exception.review_status_label ?? REVIEW_STATUS_LABEL[exception.review_status]}
          </Badge>
          {exception.reviewed_by ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {exception.reviewed_by.name} — {formatDateTime(exception.reviewed_at)}
            </p>
          ) : null}
          {exception.review_note ? (
            <p className="mt-0.5 max-w-xs text-xs italic text-slate-500 dark:text-slate-400">
              « {exception.review_note} »
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (exception) =>
        canReview && exception.review_status === "open" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSelected(exception)}
            icon={<IconGavel className="h-3.5 w-3.5" />}
          >
            Arbitrer
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(exception) => exception.id}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        meta={meta}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        emptyTitle={
          search !== ""
            ? "Aucun écart ne correspond à la recherche"
            : reviewStatus === "open"
              ? "Aucun écart en attente"
              : "Aucun écart"
        }
        emptyDescription={
          search !== ""
            ? "Le filtre porte sur les écarts de la page affichée."
            : reviewStatus === "open"
              ? "Tous les écarts détectés ont été arbitrés."
              : "Aucun écart ne correspond à ce filtre."
        }
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Filtrer : facture, fournisseur, motif…",
          label: "Filtrer les écarts affichés",
        }}
        toolbar={
          <SelectField
            label="Arbitrage"
            fieldClassName="w-full sm:w-56"
            value={reviewStatus}
            onChange={(event) => {
              setReviewStatus(event.target.value as ReviewStatus | "");
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        }
      />

      <ExceptionReviewDialog
        exception={selected}
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        onReviewed={reload}
      />
    </>
  );
}
