"use client";

import { useCallback, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  ErrorState,
  LoadingState,
  SelectField,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconBanknote, IconPencil, IconPlus, IconTrash } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useMutation } from "@/hooks/useMutation";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { CURRENCIES } from "@/lib/currency";
import { formatDate, formatExchangeRate } from "@/lib/format";
import { currencyService } from "@/services";
import type { Currency, ExchangeRateQuote } from "@/types/api";
import { ExchangeRateFormDialog } from "./ExchangeRateFormDialog";

const SOURCE_TONE: Record<string, "success" | "info" | "warning"> = {
  fixed_peg: "success",
  provider: "info",
  manual: "warning",
};

/**
 * Gestion des devises : le referentiel d'un cote, l'historique des taux de
 * l'autre.
 *
 * Les deux ne se pilotent pas de la meme facon, et l'ecran le montre. Le
 * referentiel — quelles devises, combien de decimales, laquelle sert
 * d'agregation — est une donnee de configuration, servie par l'API et non
 * modifiable ici. Les taux, eux, s'administrent : ils vivent, se superposent
 * par date d'effet, et deplacent directement le montant autorise au paiement.
 */
export function CurrencyView() {
  const { can } = useAuth();
  const [base, setBase] = useState("");
  const [quote, setQuote] = useState("");
  const [editing, setEditing] = useState<ExchangeRateQuote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<ExchangeRateQuote | null>(null);

  const loadReference = useCallback(() => currencyService.reference(), []);
  const {
    data: reference,
    isLoading: isLoadingReference,
    error: referenceError,
    reload: reloadReference,
  } = useAsyncData(loadReference);

  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      currencyService.listRates({
        page,
        per_page: perPage,
        base_currency: (base || undefined) as Currency | undefined,
        quote_currency: (quote || undefined) as Currency | undefined,
        ...sortParams,
      }),
    [base, quote, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<ExchangeRateQuote>(fetcher);

  const deleteAction = useCallback((id: number) => currencyService.removeRate(id), []);
  const deletion = useMutation(deleteAction);

  const canManage = can("currencies.manage");

  async function confirmDeletion() {
    if (!pendingDeletion) return;

    const result = await deletion.run(pendingDeletion.id);
    if (result !== null) {
      setPendingDeletion(null);
      reload();
    }
  }

  const columns: Array<Column<ExchangeRateQuote>> = [
    {
      key: "pair",
      header: "Paire",
      sortKey: "base_currency",
      cell: (item) => (
        <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
          {item.base_currency} → {item.quote_currency}
        </span>
      ),
    },
    {
      key: "rate",
      header: "Taux",
      sortKey: "rate",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (item) => (
        <span title={`1 ${item.base_currency} = ${item.rate} ${item.quote_currency}`}>
          {formatExchangeRate(item.rate)}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      sortKey: "source",
      cell: (item) => (
        <Badge tone={SOURCE_TONE[item.source] ?? "neutral"}>{item.source_label}</Badge>
      ),
    },
    {
      key: "effective_from",
      header: "En vigueur depuis",
      sortKey: "effective_from",
      cell: (item) => formatDate(item.effective_from),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (item) =>
        canManage ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              // Une parite fixe est une donnee de droit : l'interface le dit
              // au survol plutot que de laisser l'API repondre 409.
              disabled={!item.is_editable}
              title={
                item.is_editable
                  ? undefined
                  : "Parité fixe réglementaire : ni modifiable ni supprimable"
              }
              onClick={() => {
                setEditing(item);
                setIsFormOpen(true);
              }}
              icon={<IconPencil className="h-3.5 w-3.5" />}
            >
              Corriger
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!item.is_editable}
              title={
                item.is_editable
                  ? undefined
                  : "Parité fixe réglementaire : ni modifiable ni supprimable"
              }
              onClick={() => {
                deletion.reset();
                setPendingDeletion(item);
              }}
              icon={<IconTrash className="h-3.5 w-3.5" />}
            >
              Supprimer
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          icon={<IconBanknote className="h-4 w-4" />}
          title="Référentiel des devises"
          description="Servi par l'API, pas recopié côté interface : c'est le nombre de décimales du backend qui décide de l'affichage d'un montant."
        />
        <CardBody className="flex flex-col gap-5">
          {isLoadingReference ? <LoadingState label="Chargement du référentiel…" /> : null}
          {referenceError ? (
            <ErrorState error={referenceError} onRetry={reloadReference} />
          ) : null}

          {reference ? (
            <>
              <DescriptionList
                items={[
                  {
                    label: "Devise par défaut",
                    value: (
                      <span className="flex flex-wrap items-center gap-2">
                        {reference.default_currency}
                        <Badge tone="info">Proposée à chaque nouveau document</Badge>
                      </span>
                    ),
                  },
                  {
                    label: "Devise de référence",
                    value: (
                      <span className="flex flex-wrap items-center gap-2">
                        {reference.base_currency}
                        <Badge tone="neutral">Unité d&apos;agrégation du pilotage</Badge>
                      </span>
                    ),
                  },
                ]}
              />

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {reference.currencies.map((currency) => (
                  <li
                    key={currency.code}
                    className="rounded-sm border border-slate-200 px-4 py-3 dark:border-slate-800"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {currency.code}{" "}
                      <span className="font-normal text-slate-500 dark:text-slate-400">
                        {currency.symbol}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {currency.label}
                    </p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      {currency.decimals === 0
                        ? "Pas de sous-unité — les montants sont entiers."
                        : `${currency.decimals} décimales`}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </CardBody>
      </Card>

      <DataTable
        title="Taux de change"
        description="Seul le sens base → cotée est stocké ; l'inverse et la triangulation (USD → XOF par l'euro) sont calculés. Deux lignes symétriques qui divergeraient donneraient deux rapprochements différents selon le sens de lecture."
        icon={<IconBanknote className="h-4 w-4" />}
        actions={
          canManage ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setIsFormOpen(true);
              }}
              icon={<IconPlus className="h-3.5 w-3.5" />}
            >
              Enregistrer un taux
            </Button>
          ) : null
        }
        columns={columns}
        rows={items}
        getRowKey={(item) => item.id}
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
        emptyTitle="Aucun taux"
        emptyDescription="Aucune cotation ne correspond à ce filtre."
        toolbar={
          <>
            <SelectField
              label="Devise de base"
              fieldClassName="w-full sm:w-44"
              value={base}
              onChange={(event) => {
                setBase(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Toutes</option>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Devise cotée"
              fieldClassName="w-full sm:w-44"
              value={quote}
              onChange={(event) => {
                setQuote(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Toutes</option>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </SelectField>
          </>
        }
      />

      {canManage ? (
        <>
          <ExchangeRateFormDialog
            key={`${isFormOpen}-${editing?.id ?? "new"}`}
            rate={editing}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSaved={reload}
          />

          <ConfirmDialog
            isOpen={pendingDeletion !== null}
            onClose={() => setPendingDeletion(null)}
            onConfirm={confirmDeletion}
            title="Supprimer ce taux ?"
            description={
              pendingDeletion
                ? `${pendingDeletion.base_currency} → ${pendingDeletion.quote_currency}, en vigueur depuis le ${formatDate(pendingDeletion.effective_from)}`
                : undefined
            }
            confirmLabel="Supprimer définitivement"
            confirmIcon={<IconTrash className="h-4 w-4" />}
            isPending={deletion.isPending}
            error={deletion.error}
            errorFallback="La suppression du taux a échoué."
          >
            Les rapprochements déjà exécutés conservent le taux qu&apos;ils ont appliqué : leur
            preuve est archivée avec eux. En revanche, un rapprochement rejoué après cette
            suppression retombera sur la cotation antérieure — ou échouera si aucune n&apos;existe.
          </ConfirmDialog>
        </>
      ) : null}
    </div>
  );
}
