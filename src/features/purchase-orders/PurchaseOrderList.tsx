"use client";

import { useCallback, useState } from "react";
import { Badge, Button, DataTable, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconPlus } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { PURCHASE_ORDER_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { purchaseOrderService } from "@/services";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/api";
import { PurchaseOrderFormDialog } from "./PurchaseOrderFormDialog";

const STATUS_OPTIONS: Array<{ value: PurchaseOrderStatus | ""; label: string }> = [
  { value: "", label: "Tous les statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "open", label: "Ouvert" },
  { value: "partially_received", label: "Partiellement reçu" },
  { value: "fully_received", label: "Intégralement reçu" },
  { value: "closed", label: "Clôturé" },
  { value: "cancelled", label: "Annulé" },
];

export function PurchaseOrderList({ initialSearch = "" }: { initialSearch?: string }) {
  const { can } = useAuth();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // La recherche est servie par l'API : on attend une pause de frappe plutot
  // que d'envoyer une requete par caractere.
  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      purchaseOrderService.list({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: status || undefined,
        ...sortParams,
      }),
    [debouncedSearch, status, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<PurchaseOrder>(fetcher);

  const columns: Array<Column<PurchaseOrder>> = [
    {
      key: "reference",
      header: "Référence",
      sortKey: "reference",
      cell: (order) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{order.reference}</span>
      ),
    },
    {
      key: "supplier",
      header: "Fournisseur",
      sortKey: "supplier",
      cell: (order) => order.supplier?.name ?? "—",
    },
    {
      key: "project",
      header: "Chantier",
      sortKey: "project",
      cell: (order) => (
        <div>
          <p>{order.project?.name ?? "—"}</p>
          {order.project?.code ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{order.project.code}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "ordered_at",
      header: "Commandé le",
      sortKey: "ordered_at",
      cell: (order) => formatDate(order.ordered_at),
    },
    {
      key: "documents",
      header: "Documents",
      // Trois compteurs dans une cellule : le tri porte sur le nombre de
      // lignes, seul des trois qui existe toujours.
      sortKey: "lines",
      className: "tabular-nums text-xs",
      cell: (order) => (
        <span className="text-slate-600 dark:text-slate-400">
          {order.lines_count ?? 0} ligne(s) · {order.delivery_notes_count ?? 0} BL ·{" "}
          {order.invoices_count ?? 0} facture(s)
        </span>
      ),
    },
    {
      key: "total",
      header: "Montant",
      sortKey: "total",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (order) =>
        order.total_amount === undefined ? "—" : formatMoney(order.total_amount, order.currency),
    },
    {
      key: "status",
      header: "Statut",
      sortKey: "status",
      cell: (order) => (
        <Badge tone={PURCHASE_ORDER_STATUS_TONE[order.status]}>{order.status_label}</Badge>
      ),
    },
  ];

  const canManage = can("procurement.manage");

  return (
    <div className="flex flex-col gap-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsFormOpen(true)} icon={<IconPlus className="h-4 w-4" />}>
            Créer un bon de commande
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(order) => order.id}
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
        emptyTitle="Aucun bon de commande"
        emptyDescription="Les bons de commande fixent ce qui est autorisé à l'achat, en quantité comme en prix."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher une référence, un fournisseur…",
          label: "Rechercher un bon de commande",
        }}
        toolbar={
          <SelectField
            label="Statut"
            fieldClassName="w-full sm:w-56"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PurchaseOrderStatus | "");
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

      {canManage ? (
        <PurchaseOrderFormDialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onCreated={reload}
        />
      ) : null}
    </div>
  );
}
