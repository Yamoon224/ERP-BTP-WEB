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
import { IconArrowRight, IconCrane, IconPurchaseOrder } from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { PURCHASE_ORDER_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { purchaseOrderService, referenceService } from "@/services";
import type { PurchaseOrder } from "@/types/api";

/**
 * Fiche chantier et engagements qui lui sont rattaches.
 *
 * Un chantier n'existe, dans ce produit, que par ce qu'on y a engage : la
 * liste des bons de commande est donc la moitie utile de l'ecran.
 */
export function ProjectDetail({ projectId }: { projectId: number }) {
  const loadProject = useCallback(() => referenceService.findProject(projectId), [projectId]);
  const { data: project, isLoading, error, reload } = useAsyncData(loadProject);

  const ordersFetcher = useCallback(
    (page: number, perPage: number) =>
      purchaseOrderService.list({ project_id: projectId, page, per_page: perPage }),
    [projectId],
  );
  const orders = usePaginatedData<PurchaseOrder>(ordersFetcher);

  if (isLoading) return <LoadingState label="Chargement du chantier…" />;
  if (error || project === null) {
    return <ErrorState error={error ?? new Error("Chantier introuvable.")} onRetry={reload} />;
  }

  const columns: Array<Column<PurchaseOrder>> = [
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
      key: "supplier",
      header: "Fournisseur",
      cell: (order) => order.supplier?.name ?? "—",
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
      header: "Montant engagé",
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

  return (
    <>
      <PageHeader
        title={project.name}
        description={`Chantier ${project.code}`}
        icon={<IconCrane className="h-5 w-5" />}
        actions={
          <LinkButton href="/projects" icon={<IconArrowRight className="h-4 w-4 rotate-180" />}>
            Retour à la liste
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Identité" icon={<IconCrane className="h-4 w-4" />} />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Code", value: project.code },
                { label: "Intitulé", value: project.name },
                { label: "Maître d'ouvrage", value: project.client_name ?? "—" },
                {
                  label: "État",
                  value: project.is_active ? (
                    <Badge tone="success">En cours</Badge>
                  ) : (
                    <Badge tone="neutral">Clos</Badge>
                  ),
                },
                { label: "Créé le", value: formatDate(project.created_at) },
              ]}
            />
          </CardBody>
        </Card>

        <DataTable
          title="Bons de commande du chantier"
          description="Ce qui a été engagé sur ce chantier, tous fournisseurs confondus."
          icon={<IconPurchaseOrder className="h-4 w-4" />}
          columns={columns}
          rows={orders.items}
          getRowKey={(order) => order.id}
          isLoading={orders.isLoading}
          error={orders.error}
          onRetry={orders.reload}
          meta={orders.meta}
          onPageChange={orders.setPage}
          onPerPageChange={orders.setPerPage}
          emptyTitle="Aucun bon de commande"
          emptyDescription="Rien n'a encore été engagé sur ce chantier."
        />
      </div>
    </>
  );
}
