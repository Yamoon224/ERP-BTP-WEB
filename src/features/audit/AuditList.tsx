"use client";

import { useCallback, useState } from "react";
import { Badge, Button, DataTable, FormAlert, Modal, SelectField, TextField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconExternal, IconShield } from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { formatDateTime } from "@/lib/format";
import { auditService } from "@/services";
import type { AuditLog } from "@/types/api";

const EVENT_TONE: Record<string, "success" | "info" | "danger" | "neutral"> = {
  created: "success",
  updated: "info",
  deleted: "danger",
};

/**
 * Journal d'audit.
 *
 * L'ecran n'offre aucune action d'ecriture — pas meme une purge — et c'est ce
 * qui lui donne sa valeur : un journal que l'on peut retoucher n'atteste de
 * rien. On y vient pour repondre a une question precise (« qui a change le
 * taux EUR/XOF la semaine derniere ? »), d'ou les filtres par type d'objet,
 * par evenement et par periode plutot qu'un simple defilement.
 */
export function AuditList() {
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("");
  const [subjectType, setSubjectType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inspected, setInspected] = useState<AuditLog | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const loadFacets = useCallback(() => auditService.facets(), []);
  const { data: facets } = useAsyncData(loadFacets);

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      auditService.list({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        event: event || undefined,
        subject_type: subjectType || undefined,
        from: from || undefined,
        to: to || undefined,
        ...sortParams,
      }),
    [debouncedSearch, event, subjectType, from, to, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<AuditLog>(fetcher);

  const columns: Array<Column<AuditLog>> = [
    {
      key: "created_at",
      header: "Horodatage",
      sortKey: "created_at",
      cell: (log) => (
        <span className="tabular-nums text-slate-700 dark:text-slate-200">
          {formatDateTime(log.created_at)}
        </span>
      ),
    },
    {
      key: "event",
      header: "Évènement",
      sortKey: "event",
      cell: (log) => (
        <Badge tone={EVENT_TONE[log.event ?? ""] ?? "neutral"}>{log.event_label}</Badge>
      ),
    },
    {
      key: "subject",
      header: "Objet",
      sortKey: "subject_type",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
            {log.subject_label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {log.subject_id === null ? "—" : `#${log.subject_id}`}
          </p>
        </div>
      ),
    },
    {
      key: "causer",
      header: "Auteur",
      cell: (log) => (
        <span
          className={
            log.causer === null
              ? "text-xs italic text-slate-500 dark:text-slate-400"
              : "text-slate-700 dark:text-slate-200"
          }
        >
          {log.causer_label}
        </span>
      ),
    },
    {
      key: "changes",
      header: "Champs touchés",
      cell: (log) => {
        const fields = Object.keys(log.properties.attributes ?? {});

        return fields.length === 0 ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {fields.slice(0, 3).join(", ")}
            {fields.length > 3 ? ` +${fields.length - 3}` : null}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (log) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setInspected(log)}
          icon={<IconExternal className="h-3.5 w-3.5" />}
        >
          Détail
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <FormAlert tone="warning">
        Journal en <strong>lecture seule</strong>. Aucune entrée ne peut être ajoutée, modifiée ou
        supprimée depuis l&apos;application, y compris par un administrateur.
      </FormAlert>

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(log) => log.id}
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
        emptyTitle="Aucune entrée"
        emptyDescription="Aucun mouvement ne correspond à ces filtres."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher un objet, une description…",
          label: "Rechercher dans le journal",
        }}
        toolbar={
          <>
            <SelectField
              label="Évènement"
              fieldClassName="w-full sm:w-44"
              value={event}
              onChange={(nextEvent) => {
                setEvent(nextEvent.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              {(facets?.events ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Type d'objet"
              fieldClassName="w-full sm:w-56"
              value={subjectType}
              onChange={(nextEvent) => {
                setSubjectType(nextEvent.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              {(facets?.subject_types ?? []).map((value) => (
                <option key={value} value={value}>
                  {value.split("\\").pop()}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Du"
              type="date"
              placeholder="2026-09-01"
              fieldClassName="w-full sm:w-40"
              value={from}
              onChange={(nextEvent) => {
                setFrom(nextEvent.target.value);
                setPage(1);
              }}
            />

            <TextField
              label="Au"
              type="date"
              placeholder="2026-09-30"
              fieldClassName="w-full sm:w-40"
              value={to}
              onChange={(nextEvent) => {
                setTo(nextEvent.target.value);
                setPage(1);
              }}
            />
          </>
        }
      />

      <AuditDetailDialog log={inspected} onClose={() => setInspected(null)} />
    </div>
  );
}

/**
 * Detail d'une entree : l'avant et l'apres, cote a cote.
 *
 * Un journal qui n'affiche que « modifie » ne sert a rien. Ce qui compte, dans
 * une revue, c'est quelle valeur a remplace quelle autre.
 */
function AuditDetailDialog({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  const after = log?.properties.attributes ?? {};
  const before = log?.properties.old ?? {};
  const fields = Array.from(new Set([...Object.keys(after), ...Object.keys(before)]));

  return (
    <Modal
      isOpen={log !== null}
      onClose={onClose}
      title={log ? `${log.event_label} — ${log.subject_label}` : "Entrée du journal"}
      description={
        log
          ? `${formatDateTime(log.created_at)} · ${log.causer_label}${
              log.subject_id === null ? "" : ` · objet #${log.subject_id}`
            }`
          : undefined
      }
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {log === null ? null : (
        <div className="flex flex-col gap-4">
          {fields.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cette entrée n&apos;archive aucune valeur : seul l&apos;évènement a été journalisé.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="grad-brand text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                      Champ
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                      Avant
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                      Après
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr
                      key={field}
                      className="border-b border-slate-100 last:border-0 odd:bg-[var(--surface)] even:bg-slate-50/70 dark:border-slate-800/70 dark:even:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {field}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                        {renderValue(before[field])}
                      </td>
                      <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                        {renderValue(after[field])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Entrée n°{log.id} — journal <code>{log.log_name ?? "default"}</code>. Elle ne peut être
            ni modifiée ni supprimée.
          </p>
        </div>
      )}
    </Modal>
  );
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}
