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
  IconBuilding,
  IconPurchaseOrder,
} from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { INVOICE_STATUS_TONE, PURCHASE_ORDER_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { invoiceService, purchaseOrderService, referenceService } from "@/services";
import type { Invoice, PurchaseOrder } from "@/types/api";

/**
 * Fiche fournisseur.
 *
 * La fiche seule n'apprendrait rien : un fournisseur se juge a ce qu'on lui a
 * commande et a ce qu'il a facture. Les deux listes sont donc servies ici,
 * paginees separement — on consulte une fiche pour repondre a « ou en est-on
 * avec eux », pas pour lire un code TVA.
 */
export function SupplierDetail({ supplierId }: { supplierId: string }) {
  const loadSupplier = useCallback(
    () => referenceService.findSupplier(supplierId),
    [supplierId],
  );
  const { data: supplier, isLoading, error, reload } = useAsyncData(loadSupplier);

  const ordersFetcher = useCallback(
    (page: number, perPage: number) =>
      purchaseOrderService.list({ supplier_id: supplierId, page, per_page: perPage }),
    [supplierId],
  );
  const orders = usePaginatedData<PurchaseOrder>(ordersFetcher, { initialPerPage: 5 });

  const invoicesFetcher = useCallback(
    (page: number, perPage: number) =>
      invoiceService.list({ supplier_id: supplierId, page, per_page: perPage }),
    [supplierId],
  );
  const invoices = usePaginatedData<Invoice>(invoicesFetcher, { initialPerPage: 5 });

  if (isLoading) return <LoadingState label="Chargement du fournisseur…" />;
  if (error || supplier === null) {
    return <ErrorState error={error ?? new Error("Fournisseur introuvable.")} onRetry={reload} />;
  }

  const orderColumns: Array<Column<PurchaseOrder>> = [
    {
      key: "reference",
      header: "Référence",
      cell: (order) => (
        <Link
          href={`/purchase-orders/${order.id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {order.reference}
        </Link>
      ),
    },
    {
      key: "project",
      header: "Chantier",
      cell: (order) => order.project?.name ?? "—",
    },
    {
      key: "status",
      header: "Statut",
      cell: (order) => (
        <Badge tone={PURCHASE_ORDER_STATUS_TONE[order.status]}>{order.status_label}</Badge>
      ),
    },
    {
      key: "total",
      header: "Montant",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (order) =>
        order.total_amount === undefined ? "—" : formatMoney(order.total_amount, order.currency),
    },
    {
      key: "ordered_at",
      header: "Commandé le",
      cell: (order) => formatDate(order.ordered_at),
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
        title={supplier.name}
        description={`Fournisseur ${supplier.code}`}
        icon={<IconBuilding className="h-5 w-5" />}
        actions={
          <LinkButton href="/suppliers" icon={<IconArrowRight className="h-4 w-4 rotate-180" />}>
            Retour à la liste
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Identité" icon={<IconBuilding className="h-4 w-4" />} />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Code", value: supplier.code },
                { label: "Raison sociale", value: supplier.name },
                { label: "Numéro de TVA", value: supplier.vat_number ?? "—" },
                { label: "Facturation", value: supplier.email ?? "—" },
                {
                  label: "État",
                  value: supplier.is_active ? (
                    <Badge tone="success">Actif</Badge>
                  ) : (
                    <Badge tone="neutral">Inactif</Badge>
                  ),
                },
                { label: "Créé le", value: formatDate(supplier.created_at) },
              ]}
            />
          </CardBody>
        </Card>

        <DataTable
          title="Bons de commande"
          description="Ce qui a été engagé auprès de ce fournisseur."
          icon={<IconPurchaseOrder className="h-4 w-4" />}
          columns={orderColumns}
          rows={orders.items}
          getRowKey={(order) => order.id}
          isLoading={orders.isLoading}
          error={orders.error}
          onRetry={orders.reload}
          meta={orders.meta}
          onPageChange={orders.setPage}
          onPerPageChange={orders.setPerPage}
          emptyTitle="Aucun bon de commande"
          emptyDescription="Rien n'a encore été engagé auprès de ce fournisseur."
        />

        <DataTable
          title="Factures"
          description="Ce que ce fournisseur a réclamé, et où en est son contrôle."
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
          emptyDescription="Ce fournisseur n'a encore rien facturé."
        />
      </div>
    </>
  );
}
