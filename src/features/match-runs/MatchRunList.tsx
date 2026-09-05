"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Badge, DataTable, FormAlert, LinkButton, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconExternal } from "@/components/ui/icons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE, MATCH_TRIGGER_LABEL } from "@/lib/domain-labels";
import { formatDateTime, formatMoney } from "@/lib/format";
import { matchingService } from "@/services";
import type { ActorType, MatchRun, MatchStatus, MatchTrigger } from "@/types/api";

const STATUS_OPTIONS = [{ value: "", label: "Tous les verdicts" }].concat(
  (Object.keys(MATCH_STATUS_LABEL) as MatchStatus[]).map((status) => ({
    value: status,
    label: MATCH_STATUS_LABEL[status],
  })),
);

const TRIGGER_OPTIONS = [{ value: "", label: "Toutes les origines" }].concat(
  (Object.keys(MATCH_TRIGGER_LABEL) as MatchTrigger[]).map((trigger) => ({
    value: trigger,
    label: MATCH_TRIGGER_LABEL[trigger],
  })),
);

const ACTOR_OPTIONS = [
  { value: "", label: "Moteur et humains" },
  { value: "system", label: "Décidé par le moteur" },
  { value: "user", label: "Décidé par une personne" },
];

/**
 * Registre des rapprochements — toutes factures confondues.
 *
 * L'ecran ne propose ni modification ni suppression, et c'est le fond du
 * sujet : une execution archive **qui** a decide, **quand**, avec quelle
 * version du moteur, quelles tolerances et quelle preuve chiffree. La
 * retoucher reviendrait a reecrire une decision passee ; l'effacer, a
 * supprimer la justification d'un paiement deja autorise.
 *
 * Le geste equivalent existe et se trouve sur la facture : « Rejouer le
 * rapprochement » cree une NOUVELLE execution qui prend la main sur la
 * precedente sans la detruire.
 */
export function MatchRunList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [trigger, setTrigger] = useState("");
  const [actorType, setActorType] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      matchingService.listAllRuns({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: (status || undefined) as MatchStatus | undefined,
        trigger: (trigger || undefined) as MatchTrigger | undefined,
        actor_type: (actorType || undefined) as ActorType | undefined,
        ...sortParams,
      }),
    [debouncedSearch, status, trigger, actorType, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<MatchRun>(fetcher);

  const columns: Array<Column<MatchRun>> = [
    {
      key: "id",
      header: "Exécution",
      sortKey: "id",
      cell: (run) => (
        <Link
          href={`/match-runs/${run.id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          #{run.id}
        </Link>
      ),
    },
    {
      key: "invoice",
      header: "Facture",
      cell: (run) =>
        run.invoice ? (
          <div className="min-w-0">
            <Link
              href={`/invoices/${run.invoice.id}`}
              className="block truncate font-medium text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400"
            >
              {run.invoice.reference}
            </Link>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {run.invoice.supplier?.name ?? "—"}
            </span>
          </div>
        ) : (
          `Facture #${run.invoice_id}`
        ),
    },
    {
      key: "status",
      header: "Verdict",
      sortKey: "status",
      cell: (run) => <Badge tone={MATCH_STATUS_TONE[run.status]}>{run.status_label}</Badge>,
    },
    {
      key: "matched",
      header: "Autorisé",
      sortKey: "matched_amount",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (run) => formatMoney(run.matched_amount, run.currency),
    },
    {
      key: "unmatched",
      header: "Bloqué",
      sortKey: "unmatched_amount",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (run) => (
        <span
          className={
            run.unmatched_amount > 0 ? "font-medium text-rose-600 dark:text-rose-400" : undefined
          }
        >
          {formatMoney(run.unmatched_amount, run.currency)}
        </span>
      ),
    },
    {
      key: "exceptions",
      header: "Écarts",
      sortKey: "exceptions",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (run) =>
        run.exception_count === 0 ? (
          <span className="text-slate-400">0</span>
        ) : (
          <Badge tone="warning">{run.exception_count}</Badge>
        ),
    },
    {
      key: "trigger",
      header: "Origine",
      sortKey: "trigger",
      cell: (run) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {MATCH_TRIGGER_LABEL[run.trigger] ?? run.trigger}
        </span>
      ),
    },
    {
      key: "decided_by",
      header: "Décidé par",
      cell: (run) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700 dark:text-slate-200">
            {run.decided_by.label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            moteur v{run.engine_version}
          </p>
        </div>
      ),
    },
    {
      key: "evaluated_at",
      header: "Exécuté le",
      sortKey: "evaluated_at",
      cell: (run) => formatDateTime(run.evaluated_at),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (run) => (
        <LinkButton
          size="sm"
          href={`/match-runs/${run.id}`}
          icon={<IconExternal className="h-3.5 w-3.5" />}
        >
          Détail
        </LinkButton>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <FormAlert tone="warning">
        Une exécution est <strong>immuable</strong> : elle archive une décision et sa preuve. Elle
        ne se modifie ni ne se supprime — pour corriger un rapprochement, on le{" "}
        <strong>rejoue</strong> depuis la facture, ce qui crée une nouvelle exécution sans effacer
        la précédente.
      </FormAlert>

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(run) => run.id}
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
        emptyTitle="Aucune exécution"
        emptyDescription="Aucun rapprochement ne correspond à ces filtres."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher une référence de facture…",
          label: "Rechercher un rapprochement",
        }}
        toolbar={
          <>
            <SelectField
              label="Verdict"
              fieldClassName="w-full sm:w-52"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
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
              label="Origine"
              fieldClassName="w-full sm:w-56"
              value={trigger}
              onChange={(event) => {
                setTrigger(event.target.value);
                setPage(1);
              }}
            >
              {TRIGGER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Auteur"
              fieldClassName="w-full sm:w-52"
              value={actorType}
              onChange={(event) => {
                setActorType(event.target.value);
                setPage(1);
              }}
            >
              {ACTOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </>
        }
      />
    </div>
  );
}
