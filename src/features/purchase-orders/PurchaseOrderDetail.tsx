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
  LinkButton,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import {
  IconArrowRight,
  IconBilling,
  IconDelivery,
  IconPurchaseOrder,
} from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import {
  DELIVERY_NOTE_STATUS_TONE,
  INVOICE_STATUS_TONE,
  PURCHASE_ORDER_STATUS_TONE,
} from "@/lib/domain-labels";
import { formatDate, formatMoney, formatQuantity, formatUnitPrice } from "@/lib/format";
import { deliveryNoteService, invoiceService, purchaseOrderService } from "@/services";
import type { DeliveryNote, Invoice, PurchaseOrderLine } from "@/types/api";

/**
 * Bon de commande : l'engagement, puis ce qui s'y est raccroche.
 *
 * Les trois voies du controle se lisent depuis cet ecran : ce qui a ete
 * commande (les lignes), ce qui a ete recu (les bons de livraison) et ce qui a
 * ete reclame (les factures). C'est le seul endroit ou les trois apparaissent
 * ensemble pour un meme engagement.
 */
export function PurchaseOrderDetail({ purchaseOrderId }: { purchaseOrderId: string }) {
  const loader = useCallback(
    () => purchaseOrderService.find(purchaseOrderId),
    [purchaseOrderId],
  );
  const { data: order, isLoading, error, reload } = useAsyncData(loader);

  const deliveriesFetcher = useCallback(
    (page: number, perPage: number) =>
      deliveryNoteService.list({
        purchase_order_id: purchaseOrderId,
        page,
        per_page: perPage,
      }),
    [purchaseOrderId],
  );
  const deliveries = usePaginatedData<DeliveryNote>(deliveriesFetcher, { initialPerPage: 5 });

  const invoicesFetcher = useCallback(
    (page: number, perPage: number) =>
      invoiceService.list({ purchase_order_id: purchaseOrderId, page, per_page: perPage }),
    [purchaseOrderId],
  );
  const invoices = usePaginatedData<Invoice>(invoicesFetcher, { initialPerPage: 5 });

  if (isLoading) return <LoadingState label="Chargement du bon de commande…" />;
  if (error || order === null) {
    return (
      <ErrorState error={error ?? new Error("Bon de commande introuvable.")} onRetry={reload} />
    );
  }

  const lines = order.lines ?? [];

  const lineColumns: Array<Column<PurchaseOrderLine>> = [
    {
      key: "line_number",
      header: "#",
      className: "tabular-nums",
      cell: (line) => line.line_number,
    },
    {
      key: "item",
      header: "Article",
      cell: (line) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100">{line.item_code}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{line.description}</p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantité commandée",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (line) => formatQuantity(line.quantity_ordered, line.unit),
    },
    {
      key: "unit_price",
      header: "Prix unitaire",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (line) => formatUnitPrice(line.unit_price, order.currency),
    },
    {
      key: "amount",
      header: "Montant",
      className: "text-right tabular-nums font-medium",
      headerClassName: "text-right",
      cell: (line) => formatMoney(line.ordered_amount, order.currency),
    },
  ];

  const deliveryColumns: Array<Column<DeliveryNote>> = [
    {
      key: "reference",
      header: "Référence",
      cell: (note) => (
        <Link
          href={`/delivery-notes/${note.id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {note.reference}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Contrôle",
      cell: (note) => (
        <Badge tone={DELIVERY_NOTE_STATUS_TONE[note.status]}>{note.status_label}</Badge>
      ),
    },
    {
      key: "counts",
      header: "Ouvre un droit",
      cell: (note) =>
        note.counts_as_received ? (
          <Badge tone="success">Oui</Badge>
        ) : (
          <Badge tone="neutral">Non</Badge>
        ),
    },
    {
      key: "received_at",
      header: "Reçu le",
      cell: (note) => formatDate(note.received_at),
    },
  ];

  const invoiceColumns: Array<Column<Invoice>> = [
    {
      key: "reference",
      header: "Référence",
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
      key: "status",
      header: "Statut",
      cell: (invoice) => (
        <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>{invoice.status_label}</Badge>
      ),
    },
    {
      key: "total",
      header: "Montant",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (invoice) => formatMoney(invoice.total_amount, invoice.currency),
    },
    {
      key: "invoice_date",
      header: "Date",
      cell: (invoice) => formatDate(invoice.invoice_date),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Bon de commande ${order.reference}`}
        description={order.supplier?.name}
        icon={<IconPurchaseOrder className="h-5 w-5" />}
        actions={
          <LinkButton
            href="/purchase-orders"
            icon={<IconArrowRight className="h-4 w-4 rotate-180" />}
          >
            Retour à la liste
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader
            icon={<IconPurchaseOrder className="h-4 w-4" />}
            title="Engagement"
            description="La référence contractuelle : c'est à ces quantités et à ces prix que tout sera comparé."
            actions={
              <Badge tone={PURCHASE_ORDER_STATUS_TONE[order.status]}>{order.status_label}</Badge>
            }
          />
          <CardBody>
            <DescriptionList
              items={[
                {
                  label: "Fournisseur",
                  value: order.supplier ? (
                    <Link
                      href={`/suppliers/${order.supplier.id}`}
                      className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {order.supplier.name}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Chantier",
                  value: order.project ? (
                    <Link
                      href={`/projects/${order.project.id}`}
                      className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {order.project.name}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                { label: "Commandé le", value: formatDate(order.ordered_at) },
                {
                  label: "Devise du contrat",
                  value: `${order.currency} — unité de comparaison des prix`,
                },
                {
                  label: "Montant engagé",
                  value:
                    order.total_amount === undefined
                      ? "—"
                      : formatMoney(order.total_amount, order.currency),
                },
                { label: "Notes", value: order.notes ?? "—" },
              ]}
            />
          </CardBody>
        </Card>

        <DataTable
          title="Lignes commandées"
          description="La première des trois voies du contrôle."
          icon={<IconPurchaseOrder className="h-4 w-4" />}
          columns={lineColumns}
          rows={lines}
          getRowKey={(line) => line.id}
          emptyTitle="Aucune ligne"
          emptyDescription="Ce bon de commande ne porte aucune ligne."
        />

        <DataTable
          title="Bons de livraison"
          description="La deuxième voie : seule une livraison acceptée ouvre un droit à paiement."
          icon={<IconDelivery className="h-4 w-4" />}
          columns={deliveryColumns}
          rows={deliveries.items}
          getRowKey={(note) => note.id}
          isLoading={deliveries.isLoading}
          error={deliveries.error}
          onRetry={deliveries.reload}
          meta={deliveries.meta}
          onPageChange={deliveries.setPage}
          onPerPageChange={deliveries.setPerPage}
          emptyTitle="Aucune livraison"
          emptyDescription="Rien n'a encore été reçu sur ce bon de commande."
        />

        <DataTable
          title="Factures"
          description="La troisième voie : ce que le fournisseur réclame au titre de cet engagement."
          icon={<IconBilling className="h-4 w-4" />}
          columns={invoiceColumns}
          rows={invoices.items}
          getRowKey={(invoice) => invoice.id}
          isLoading={invoices.isLoading}
          error={invoices.error}
          onRetry={invoices.reload}
          meta={invoices.meta}
          onPageChange={invoices.setPage}
          onPerPageChange={invoices.setPerPage}
          emptyTitle="Aucune facture"
          emptyDescription="Aucune facture ne se rattache encore à ce bon de commande."
        />
      </div>
    </>
  );
}
