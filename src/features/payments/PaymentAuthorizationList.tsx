"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Badge, Button, DataTable, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconBanknote } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { paymentService } from "@/services";
import type { PaymentAuthorization, PaymentAuthorizationStatus } from "@/types/api";
import { PAYMENT_METHOD_LABEL, SettlementDialog } from "./SettlementDialog";

const STATUS_OPTIONS: Array<{ value: PaymentAuthorizationStatus | ""; label: string }> = [
  { value: "active", label: "Actives" },
  { value: "superseded", label: "Remplacées" },
  { value: "revoked", label: "Révoquées" },
  { value: "", label: "Toutes" },
];

const SETTLEMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Réglées et non réglées" },
  { value: "false", label: "Restant à régler" },
  { value: "true", label: "Déjà réglées" },
];

/**
 * Autorisations de paiement et leur reglement.
 *
 * Aucune autorisation ne peut naitre ici : elle est toujours le produit d'un
 * rapprochement. La seule ecriture offerte est le **constat** d'un reglement —
 * elle n'accepte aucun montant, et ne peut donc pas servir a payer ce que le
 * moteur a bloque.
 */
export function PaymentAuthorizationList() {
  const { can } = useAuth();
  const [status, setStatus] = useState<PaymentAuthorizationStatus | "">("active");
  const [settled, setSettled] = useState("");
  const [search, setSearch] = useState("");
  const [settling, setSettling] = useState<PaymentAuthorization | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      paymentService.listAuthorizations({
        page,
        per_page: perPage,
        status: status || undefined,
        settled: settled === "" ? undefined : settled === "true",
        search: debouncedSearch || undefined,
        ...sortParams,
      }),
    [status, settled, debouncedSearch, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<PaymentAuthorization>(fetcher);

  const canSettle = can("payments.manage");

  const columns: Array<Column<PaymentAuthorization>> = [
    {
      key: "invoice",
      header: "Facture",
      cell: (authorization) =>
        authorization.invoice ? (
          <div>
            <Link
              href={`/invoices/${authorization.invoice.id}`}
              className="font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              {authorization.invoice.reference}
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {authorization.invoice.supplier?.name ?? "—"}
            </p>
          </div>
        ) : (
          `Facture #${authorization.invoice_id}`
        ),
    },
    {
      key: "amount",
      header: "Montant autorisé",
      sortKey: "amount",
      className: "text-right tabular-nums font-medium",
      headerClassName: "text-right",
      cell: (authorization) => formatMoney(authorization.amount, authorization.currency),
    },
    {
      key: "origin",
      header: "Issue du rapprochement",
      sortKey: "match_run_id",
      cell: (authorization) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          Exécution n°{authorization.match_run_id}
        </span>
      ),
    },
    {
      key: "authorized_at",
      header: "Autorisée le",
      sortKey: "authorized_at",
      cell: (authorization) => formatDateTime(authorization.authorized_at),
    },
    {
      key: "status",
      header: "Statut",
      sortKey: "status",
      cell: (authorization) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={PAYMENT_STATUS_TONE[authorization.status]}>
            {authorization.status_label ?? PAYMENT_STATUS_LABEL[authorization.status]}
          </Badge>
          {authorization.is_settled ? <Badge tone="info">Réglée</Badge> : null}
        </div>
      ),
    },
    {
      key: "settlement",
      header: "Règlement",
      sortKey: "settled_at",
      cell: (authorization) =>
        authorization.is_settled ? (
          <div className="text-xs">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {authorization.payment_reference}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              {formatDate(authorization.settled_at)}
              {authorization.payment_method
                ? ` · ${PAYMENT_METHOD_LABEL[authorization.payment_method]}`
                : ""}
            </p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">En attente de règlement</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (authorization) =>
        canSettle && authorization.status === "active" && !authorization.is_settled ? (
          <Button
            size="sm"
            onClick={() => setSettling(authorization)}
            icon={<IconBanknote className="h-3.5 w-3.5" />}
          >
            Régler
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(authorization) => authorization.id}
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
        emptyTitle={search !== "" ? "Aucune autorisation ne correspond" : "Aucune autorisation"}
        emptyDescription={
          search !== ""
            ? "Essayez une autre référence de facture, de fournisseur ou de règlement."
            : "Une autorisation de paiement naît uniquement d'un rapprochement réussi."
        }
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher : facture, fournisseur, virement…",
          label: "Rechercher une autorisation",
        }}
        toolbar={
          <>
            <SelectField
              label="Statut"
              fieldClassName="w-full sm:w-48"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PaymentAuthorizationStatus | "");
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Règlement"
              fieldClassName="w-full sm:w-52"
              value={settled}
              onChange={(event) => {
                setSettled(event.target.value);
                setPage(1);
              }}
            >
              {SETTLEMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </>
        }
      />

      <SettlementDialog
        authorization={settling}
        isOpen={settling !== null}
        onClose={() => setSettling(null)}
        onSettled={reload}
      />
    </>
  );
}
