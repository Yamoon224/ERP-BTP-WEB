"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Badge, Button, DataTable, FormAlert, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconPlus, IconRefresh } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation } from "@/hooks/useMutation";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { errorMessage } from "@/lib/api-client";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { invoiceService, matchingService } from "@/services";
import type { Invoice, InvoiceStatus } from "@/types/api";
import { InvoiceFormDialog } from "./InvoiceFormDialog";

const STATUS_OPTIONS: Array<{ value: InvoiceStatus | ""; label: string }> = [
  { value: "", label: "Tous les statuts" },
  { value: "received", label: INVOICE_STATUS_LABEL.received },
  { value: "under_review", label: INVOICE_STATUS_LABEL.under_review },
  { value: "partially_approved", label: INVOICE_STATUS_LABEL.partially_approved },
  { value: "approved", label: INVOICE_STATUS_LABEL.approved },
  { value: "disputed", label: INVOICE_STATUS_LABEL.disputed },
  { value: "cancelled", label: INVOICE_STATUS_LABEL.cancelled },
];

export function InvoiceList() {
  const { can } = useAuth();
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  // Le fetcher dépend des filtres : il doit être mémorisé sur eux, sinon
  // useAsyncData relancerait une requête à chaque rendu.
  const fetcher = useCallback(
    (page: number, perPage: number) =>
      invoiceService.list({
        page,
        per_page: perPage,
        status: status || undefined,
        search: debouncedSearch || undefined,
        ...sortParams,
      }),
    [status, debouncedSearch, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<Invoice>(fetcher);

  const rematchAction = useCallback(
    (invoiceId: number) => matchingService.runMatching(invoiceId),
    [],
  );
  const rematch = useMutation(rematchAction);

  async function handleRematch(invoiceId: number) {
    if (await rematch.run(invoiceId)) reload();
  }

  const canSubmit = can("invoicing.manage");
  const canRun = can("matching.run");

  const columns: Array<Column<Invoice>> = [
    {
      key: "reference",
      header: "Facture",
      sortKey: "reference",
      cell: (invoice) => (
        <Link
          href={`/invoices/${invoice.id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {invoice.reference}
        </Link>
      ),
    },
    {
      key: "supplier",
      header: "Fournisseur",
      sortKey: "supplier",
      cell: (invoice) => invoice.supplier?.name ?? "—",
    },
    {
      key: "date",
      header: "Date",
      sortKey: "invoice_date",
      cell: (invoice) => formatDate(invoice.invoice_date),
    },
    {
      key: "total",
      header: "Montant facturé",
      sortKey: "total",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (invoice) => formatMoney(invoice.total_amount, invoice.currency),
    },
    {
      key: "authorized",
      header: "Autorisé au paiement",
      // Pas de tri : le montant autorisé vit sur le dernier rapprochement, pas
      // sur la facture. Un ordre SQL sur cette colonne mentirait dès qu'une
      // facture aurait plusieurs exécutions.
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (invoice) => {
        const matched = invoice.latest_match_run?.matched_amount ?? 0;

        return matched > 0 ? (
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {formatMoney(matched, invoice.currency)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      sortKey: "status",
      cell: (invoice) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>
            {invoice.status_label ?? INVOICE_STATUS_LABEL[invoice.status]}
          </Badge>
          {invoice.open_exceptions_count ? (
            <Badge tone="warning">
              {invoice.open_exceptions_count} écart
              {invoice.open_exceptions_count > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (invoice) =>
        // Une facture annulée ne repasse pas par le moteur : proposer le
        // bouton ne mènerait qu'à un 409 que personne ne peut corriger.
        canRun && invoice.status !== "cancelled" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={rematch.isPending}
            onClick={() => handleRematch(invoice.id)}
            icon={<IconRefresh className="h-3.5 w-3.5" />}
          >
            Relancer
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {rematch.error ? (
        <FormAlert>{errorMessage(rematch.error, "Le rapprochement a échoué.")}</FormAlert>
      ) : null}

      {canSubmit ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsFormOpen(true)} icon={<IconPlus className="h-4 w-4" />}>
            Saisir une facture
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(invoice) => invoice.id}
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
        emptyTitle="Aucune facture"
        emptyDescription="Les factures apparaissent ici dès leur soumission, avec le résultat de leur rapprochement."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher une facture, un fournisseur…",
          label: "Rechercher une facture",
        }}
        toolbar={
          <SelectField
            label="Statut"
            fieldClassName="w-full sm:w-56"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as InvoiceStatus | "");
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

      {canSubmit ? (
        <InvoiceFormDialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onCreated={reload}
        />
      ) : null}
    </div>
  );
}
