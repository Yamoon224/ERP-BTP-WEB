"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  DescriptionList,
  ErrorState,
  FormAlert,
  LinkButton,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconArrowRight, IconDelivery, IconPurchaseOrder } from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { DELIVERY_NOTE_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatQuantity } from "@/lib/format";
import { deliveryNoteService } from "@/services";
import type { DeliveryNoteLine } from "@/types/api";

/**
 * Bon de livraison : ce qui est physiquement arrive, et si le controle l'a
 * accepte.
 *
 * L'ecran insiste sur une distinction qu'on oublie vite : un bon de livraison
 * saisi n'ouvre aucun droit tant qu'il n'est pas **accepte**. Un bon en
 * brouillon ou refuse laisse la facture correspondante non payable, meme si la
 * marchandise est sur le chantier.
 */
export function DeliveryNoteDetail({ deliveryNoteId }: { deliveryNoteId: number }) {
  const loader = useCallback(() => deliveryNoteService.find(deliveryNoteId), [deliveryNoteId]);
  const { data: note, isLoading, error, reload } = useAsyncData(loader);

  if (isLoading) return <LoadingState label="Chargement du bon de livraison…" />;
  if (error || note === null) {
    return (
      <ErrorState error={error ?? new Error("Bon de livraison introuvable.")} onRetry={reload} />
    );
  }

  const lines = note.lines ?? [];

  const columns: Array<Column<DeliveryNoteLine>> = [
    {
      key: "line_number",
      header: "#",
      className: "tabular-nums",
      cell: (line) => line.purchase_order_line?.line_number ?? "—",
    },
    {
      key: "item",
      header: "Article",
      cell: (line) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {line.purchase_order_line?.item_code ?? "—"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {line.purchase_order_line?.description ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "ordered",
      header: "Commandé",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (line) =>
        line.purchase_order_line
          ? formatQuantity(line.purchase_order_line.quantity_ordered, line.purchase_order_line.unit)
          : "—",
    },
    {
      key: "received",
      header: "Reçu",
      className: "text-right tabular-nums font-medium",
      headerClassName: "text-right",
      cell: (line) => formatQuantity(line.quantity_received, line.purchase_order_line?.unit),
    },
    {
      key: "gap",
      header: "Reste à livrer",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (line) => {
        if (!line.purchase_order_line) return "—";
        const remaining = line.purchase_order_line.quantity_ordered - line.quantity_received;

        return remaining <= 0 ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-400">
            {formatQuantity(remaining, line.purchase_order_line.unit)}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={`Bon de livraison ${note.reference}`}
        description={note.supplier?.name}
        icon={<IconDelivery className="h-5 w-5" />}
        actions={
          <>
            <LinkButton
              href={`/purchase-orders/${note.purchase_order_id}`}
              icon={<IconPurchaseOrder className="h-4 w-4" />}
            >
              Voir le bon de commande
            </LinkButton>
            <LinkButton
              href="/delivery-notes"
              icon={<IconArrowRight className="h-4 w-4 rotate-180" />}
            >
              Retour à la liste
            </LinkButton>
          </>
        }
      />

      <div className="flex flex-col gap-5">
        {note.counts_as_received ? null : (
          <FormAlert tone="warning">
            Ce bon n&apos;est pas accepté : les quantités ci-dessous{" "}
            <strong>n&apos;ouvrent aucun droit à paiement</strong>, même si la marchandise est
            arrivée. Tant que le contrôle de réception n&apos;a pas tranché, les factures
            correspondantes restent bloquées.
          </FormAlert>
        )}

        <Card>
          <CardHeader
            icon={<IconDelivery className="h-4 w-4" />}
            title="Réception"
            actions={
              <Badge tone={DELIVERY_NOTE_STATUS_TONE[note.status]}>{note.status_label}</Badge>
            }
          />
          <CardBody>
            <DescriptionList
              items={[
                {
                  label: "Bon de commande",
                  value: (
                    <Link
                      href={`/purchase-orders/${note.purchase_order_id}`}
                      className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {note.purchase_order?.reference ?? `#${note.purchase_order_id}`}
                    </Link>
                  ),
                },
                {
                  label: "Fournisseur",
                  value: note.supplier ? (
                    <Link
                      href={`/suppliers/${note.supplier.id}`}
                      className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {note.supplier.name}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                { label: "Reçu le", value: formatDate(note.received_at) },
                {
                  label: "Ouvre un droit à paiement",
                  value: note.counts_as_received ? (
                    <Badge tone="success">Oui — livraison acceptée</Badge>
                  ) : (
                    <Badge tone="warning">Non</Badge>
                  ),
                },
                { label: "Notes", value: note.notes ?? "—" },
                { label: "Saisi le", value: formatDate(note.created_at) },
              ]}
            />
          </CardBody>
        </Card>

        <DataTable
          title="Quantités reçues"
          description="Comparées ligne à ligne aux quantités commandées : c'est cet écart qui plafonne le montant payable."
          icon={<IconDelivery className="h-4 w-4" />}
          columns={columns}
          rows={lines}
          getRowKey={(line) => line.id}
          emptyTitle="Aucune ligne"
          emptyDescription="Ce bon de livraison ne porte aucune ligne."
        />
      </div>
    </>
  );
}
