"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  ErrorState,
  LoadingState,
  TitleRule,
} from "@/components/ui";
import {
  IconBanknote,
  IconBilling,
  IconException,
  IconExternal,
  IconRefresh,
} from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { ExceptionList } from "@/features/exceptions/ExceptionList";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PAYMENT_STATUS_TONE } from "@/lib/domain-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { invoiceService, matchingService } from "@/services";
import { InvoiceCurrencyDialog } from "./InvoiceCurrencyDialog";
import { MatchLineResultsTable } from "./MatchLineResultsTable";
import { MatchRunSummary } from "./MatchRunSummary";

export function InvoiceDetail({ invoiceId }: { invoiceId: number }) {
  const { can } = useAuth();

  const loader = useCallback(() => invoiceService.find(invoiceId), [invoiceId]);
  const { data: invoice, isLoading, error, reload } = useAsyncData(loader);

  const rematch = useMutation(useCallback(() => matchingService.runMatching(invoiceId), [invoiceId]));

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // L'export ne modifie rien : il est traite comme une mutation uniquement
  // pour disposer de son etat d'attente et de son message d'echec.
  const exportPdf = useMutation(
    useCallback(
      (reference: string) => invoiceService.downloadPdf(invoiceId, reference),
      [invoiceId],
    ),
  );

  async function handleRematch() {
    if (await rematch.run(undefined as never)) reload();
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!invoice) return null;

  const authorization = invoice.payment_authorization;
  const matchRun = invoice.latest_match_run;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          icon={<IconBilling className="h-4 w-4" />}
          title={`Facture ${invoice.reference}`}
          description={invoice.supplier?.name}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>
                {invoice.status_label ?? INVOICE_STATUS_LABEL[invoice.status]}
              </Badge>
              {/* L'export porte le verdict du rapprochement, pas seulement la
                  facture : c'est ce qui en fait une piece de controle. */}
              <Button
                size="sm"
                variant="secondary"
                isLoading={exportPdf.isPending}
                onClick={() => exportPdf.run(invoice.reference)}
                icon={<IconExternal className="h-3.5 w-3.5" />}
              >
                Exporter en PDF
              </Button>
              {can("invoicing.manage") ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsCurrencyOpen(true)}
                  icon={<IconBanknote className="h-3.5 w-3.5" />}
                >
                  Changer la devise
                </Button>
              ) : null}
              {can("matching.run") ? (
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={rematch.isPending}
                  onClick={handleRematch}
                  icon={<IconRefresh className="h-3.5 w-3.5" />}
                >
                  Rejouer le rapprochement
                </Button>
              ) : null}
            </div>
          }
        />
        <CardBody className="flex flex-col gap-4">
          {exportPdf.error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
            >
              <IconException className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage(exportPdf.error, "L'export PDF a échoué.")}
            </p>
          ) : null}

          {/* Une facture annulee ou en litige refuse le rapprochement (409) :
              le message du backend explique deja pourquoi, on le relaie. */}
          {rematch.error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
            >
              <IconException className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage(rematch.error, "Le rapprochement a échoué.")}
            </p>
          ) : null}

          <DescriptionList
            items={[
              { label: "Date de facture", value: formatDate(invoice.invoice_date) },
              { label: "Échéance", value: formatDate(invoice.due_date) },
              {
                label: "Montant facturé",
                value: (
                  <span className="flex flex-wrap items-baseline gap-2">
                    <strong className="tabular-nums">
                      {formatMoney(invoice.total_amount, invoice.currency)}
                    </strong>
                    <Badge tone="neutral">{invoice.currency}</Badge>
                  </span>
                ),
              },
              {
                label: "Bon de commande",
                value: invoice.purchase_order ? (
                  <Link
                    href={`/purchase-orders?search=${invoice.purchase_order.reference}`}
                    className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {invoice.purchase_order.reference}
                  </Link>
                ) : (
                  "—"
                ),
              },
              { label: "Chantier", value: invoice.purchase_order?.project?.name ?? "—" },
              {
                label: "Autorisation de paiement",
                value: authorization ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="tabular-nums">
                      {formatMoney(authorization.amount, authorization.currency)}
                    </strong>
                    <Badge tone={PAYMENT_STATUS_TONE[authorization.status]}>
                      {authorization.status_label}
                    </Badge>
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    Aucune — rien n&apos;est payable sur cette facture
                  </span>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      {matchRun ? <MatchRunSummary run={matchRun} currency={invoice.currency} /> : null}

      {matchRun?.line_results?.length ? (
        <MatchLineResultsTable lineResults={matchRun.line_results} currency={invoice.currency} />
      ) : null}

      <InvoiceCurrencyDialog
        // Remonte le dialogue a chaque ouverture pour repartir de la devise
        // courante, et non de celle choisie lors d'un essai precedent.
        key={`${isCurrencyOpen}-${invoice.currency}`}
        invoice={invoice}
        isOpen={isCurrencyOpen}
        onClose={() => setIsCurrencyOpen(false)}
        onChanged={reload}
      />

      <section>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Écarts de cette facture
        </h2>
        <TitleRule />
        <p className="mb-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
          Tant qu&apos;un écart reste ouvert, la portion concernée n&apos;est pas payable.
        </p>
        <ExceptionList invoiceId={invoice.id} />
      </section>
    </div>
  );
}
