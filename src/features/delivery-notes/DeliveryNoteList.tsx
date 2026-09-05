"use client";

import { useCallback, useState } from "react";
import { Badge, Button, DataTable, FormAlert, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconCheck, IconClose, IconPlus } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useMutation } from "@/hooks/useMutation";
import { useSort } from "@/hooks/useSort";
import { errorMessage } from "@/lib/api-client";
import { DELIVERY_NOTE_STATUS_LABEL, DELIVERY_NOTE_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatQuantity } from "@/lib/format";
import { deliveryNoteService } from "@/services";
import type { DeliveryNote, DeliveryNoteStatus } from "@/types/api";
import { DeliveryNoteFormDialog } from "./DeliveryNoteFormDialog";

const STATUS_OPTIONS: Array<{ value: DeliveryNoteStatus | ""; label: string }> = [
  { value: "", label: "Tous les statuts" },
  { value: "draft", label: DELIVERY_NOTE_STATUS_LABEL.draft },
  { value: "accepted", label: DELIVERY_NOTE_STATUS_LABEL.accepted },
  { value: "rejected", label: DELIVERY_NOTE_STATUS_LABEL.rejected },
];

/**
 * Réceptions et leur contrôle.
 *
 * L'action « accepter » est l'un des deux seuls gestes du système capables de
 * rendre de l'argent payable (l'autre étant l'arbitrage d'un écart) : elle est
 * donc réservée à `receiving.manage` et annoncée comme telle. La saisie du bon
 * et son acceptation restent deux gestes distincts, y compris dans l'interface.
 */
export function DeliveryNoteList() {
  const { can } = useAuth();
  const [status, setStatus] = useState<DeliveryNoteStatus | "">("");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      deliveryNoteService.list({
        page,
        per_page: perPage,
        status: status || undefined,
        search: debouncedSearch || undefined,
        ...sortParams,
      }),
    [status, debouncedSearch, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<DeliveryNote>(fetcher);

  const reviewAction = useCallback(
    (input: { id: number; decision: "accepted" | "rejected" }) =>
      deliveryNoteService.review(input.id, input.decision),
    [],
  );
  const review = useMutation(reviewAction);

  async function handleReview(id: number, decision: "accepted" | "rejected") {
    // L'erreur n'est pas recopiee dans un etat local : `useMutation` la porte
    // deja, et la lire ici donnerait la valeur du rendu precedent.
    if (await review.run({ id, decision })) reload();
  }

  const canManage = can("receiving.manage");

  const columns: Array<Column<DeliveryNote>> = [
    {
      key: "reference",
      header: "Bon de livraison",
      sortKey: "reference",
      cell: (note) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{note.reference}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {note.purchase_order?.reference ?? `PO #${note.purchase_order_id}`}
          </p>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Fournisseur",
      sortKey: "supplier",
      cell: (note) => note.supplier?.name ?? "—",
    },
    {
      key: "received_at",
      header: "Reçu le",
      sortKey: "received_at",
      cell: (note) => formatDate(note.received_at),
    },
    {
      key: "lines",
      header: "Lignes reçues",
      sortKey: "lines",
      cell: (note) =>
        note.lines?.length ? (
          <ul className="text-xs leading-relaxed">
            {note.lines.slice(0, 3).map((line) => (
              <li key={line.id}>
                {line.purchase_order_line?.item_code ?? `Ligne ${line.purchase_order_line_id}`} —{" "}
                {formatQuantity(line.quantity_received, line.purchase_order_line?.unit)}
              </li>
            ))}
            {note.lines.length > 3 ? (
              <li className="text-slate-500">+ {note.lines.length - 3} autre(s)</li>
            ) : null}
          </ul>
        ) : (
          <span className="text-xs text-slate-500">{note.lines_count ?? 0} ligne(s)</span>
        ),
    },
    {
      key: "status",
      header: "Statut",
      sortKey: "status",
      cell: (note) => (
        <div>
          <Badge tone={DELIVERY_NOTE_STATUS_TONE[note.status]}>
            {note.status_label ?? DELIVERY_NOTE_STATUS_LABEL[note.status]}
          </Badge>
          {!note.counts_as_received ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              N&apos;ouvre aucun droit à paiement
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
      cell: (note) =>
        canManage && note.status === "draft" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={review.isPending}
              onClick={() => handleReview(note.id, "rejected")}
              icon={<IconClose className="h-3.5 w-3.5" />}
            >
              Refuser
            </Button>
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() => handleReview(note.id, "accepted")}
              icon={<IconCheck className="h-3.5 w-3.5" />}
            >
              Accepter
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {review.error ? (
        <FormAlert>{errorMessage(review.error, "Le contrôle de réception a échoué.")}</FormAlert>
      ) : null}

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsFormOpen(true)} icon={<IconPlus className="h-4 w-4" />}>
            Saisir un bon de livraison
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(note) => note.id}
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
        emptyTitle="Aucun bon de livraison"
        emptyDescription="Une réception ne compte comme marchandise reçue qu'une fois acceptée."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher un BL, un fournisseur…",
          label: "Rechercher un bon de livraison",
        }}
        toolbar={
          <SelectField
            label="Statut"
            fieldClassName="w-full sm:w-56"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as DeliveryNoteStatus | "");
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
        <DeliveryNoteFormDialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onCreated={reload}
        />
      ) : null}
    </div>
  );
}
