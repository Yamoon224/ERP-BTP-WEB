"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  LinkButton,
  LoadingState,
  Pagination,
  SelectField,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  IconExternal,
  IconPencil,
  IconPlus,
  IconPurchaseOrder,
  IconTrash,
} from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation } from "@/hooks/useMutation";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { usePreference } from "@/hooks/usePreference";
import { useSort } from "@/hooks/useSort";
import { formatDate } from "@/lib/format";
import { referenceService } from "@/services";
import type { Project } from "@/types/api";
import { ProjectFormDialog } from "./ProjectFormDialog";

const VIEW_STORAGE_KEY = "erp_projects_view";

const STATE_OPTIONS = [
  { value: "", label: "Tous les chantiers" },
  { value: "1", label: "En cours seulement" },
  { value: "0", label: "Clos seulement" },
];

/**
 * Chantiers, en tableau ou en cartes.
 *
 * Les deux vues ne sont pas un caprice : un tableau compare (quel chantier a
 * le code le plus recent, lequel est clos), une grille de cartes se parcourt
 * quand on cherche « le chantier du viaduc » sans se souvenir de son code. Le
 * choix est une preference d'espace de travail, donc persiste d'une session a
 * l'autre.
 */
export function ProjectList() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<Project | null>(null);

  const [view, setView] = usePreference(VIEW_STORAGE_KEY, "cards");
  const isCards = view === "cards";

  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      referenceService.listProjects({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        is_active: state === "" ? undefined : state === "1",
        ...sortParams,
      }),
    [debouncedSearch, state, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<Project>(fetcher);

  const deleteAction = useCallback((id: string) => referenceService.removeProject(id), []);
  const deletion = useMutation(deleteAction);

  const canManage = can("procurement.manage");

  async function confirmDeletion() {
    if (!pendingDeletion) return;

    const result = await deletion.run(pendingDeletion.id);
    if (result !== null) {
      setPendingDeletion(null);
      reload();
    }
  }

  function startEdition(project: Project) {
    setEditing(project);
    setIsFormOpen(true);
  }

  function startDeletion(project: Project) {
    deletion.reset();
    setPendingDeletion(project);
  }

  const columns: Array<Column<Project>> = [
    {
      key: "code",
      header: "Code",
      sortKey: "code",
      cell: (project) => (
        <Link
          href={`/projects/${project.id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {project.code}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Intitulé",
      sortKey: "name",
      cell: (project) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{project.name}</span>
      ),
    },
    {
      key: "client_name",
      header: "Maître d'ouvrage",
      sortKey: "client_name",
      cell: (project) => project.client_name ?? "—",
    },
    {
      key: "is_active",
      header: "État",
      sortKey: "is_active",
      cell: (project) =>
        project.is_active ? (
          <Badge tone="success">En cours</Badge>
        ) : (
          <Badge tone="neutral">Clos</Badge>
        ),
    },
    {
      key: "created_at",
      header: "Créé le",
      sortKey: "created_at",
      cell: (project) => formatDate(project.created_at),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (project) => (
        <div className="flex justify-end gap-2">
          <LinkButton
            size="sm"
            href={`/projects/${project.id}`}
            icon={<IconExternal className="h-3.5 w-3.5" />}
          >
            Détail
          </LinkButton>
          {canManage ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => startEdition(project)}
                icon={<IconPencil className="h-3.5 w-3.5" />}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => startDeletion(project)}
                icon={<IconTrash className="h-3.5 w-3.5" />}
              >
                Supprimer
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <SelectField
        label="État"
        fieldClassName="w-full sm:w-56"
        value={state}
        onChange={(event) => {
          setState(event.target.value);
          setPage(1);
        }}
      >
        {STATE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <ViewToggle view={view} onChange={setView} />
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
            icon={<IconPlus className="h-4 w-4" />}
          >
            Créer un chantier
          </Button>
        </div>
      ) : null}

      {isCards ? (
        <Card>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-end md:justify-between dark:border-slate-800">
            <div className="w-full md:max-w-xs">
              <SearchField
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap items-end gap-3 md:justify-end">{toolbar}</div>
          </div>

          {isLoading ? <LoadingState /> : null}
          {!isLoading && error ? <ErrorState error={error} onRetry={reload} /> : null}
          {!isLoading && !error && items.length === 0 ? (
            <EmptyState
              title="Aucun chantier"
              description="Aucun chantier ne correspond à ce filtre."
            />
          ) : null}

          {!isLoading && !error && items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  canManage={canManage}
                  onEdit={() => startEdition(project)}
                  onDelete={() => startDeletion(project)}
                />
              ))}
            </ul>
          ) : null}

          {meta && meta.total > 0 ? (
            <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />
          ) : null}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(project) => project.id}
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
          emptyTitle="Aucun chantier"
          emptyDescription="Aucun chantier ne correspond à ce filtre."
          search={{
            value: search,
            onChange: (value) => {
              setSearch(value);
              setPage(1);
            },
            placeholder: "Rechercher un code, un intitulé…",
            label: "Rechercher un chantier",
          }}
          toolbar={toolbar}
        />
      )}

      {canManage ? (
        <>
          <ProjectFormDialog
            key={`${isFormOpen}-${editing?.id ?? "new"}`}
            project={editing}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSaved={reload}
          />

          <ConfirmDialog
            isOpen={pendingDeletion !== null}
            onClose={() => setPendingDeletion(null)}
            onConfirm={confirmDeletion}
            title="Supprimer ce chantier ?"
            description={
              pendingDeletion ? `${pendingDeletion.code} — ${pendingDeletion.name}` : undefined
            }
            confirmLabel="Supprimer définitivement"
            confirmIcon={<IconTrash className="h-4 w-4" />}
            isPending={deletion.isPending}
            error={deletion.error}
            errorFallback="La suppression a échoué."
          >
            La suppression n&apos;est possible que si aucun bon de commande ne porte ce chantier.
            Sinon, clôturez-le : les montants déjà engagés gardent leur référent.
          </ConfirmDialog>
        </>
      ) : null}
    </div>
  );
}

/** Recherche de la vue en cartes, qui n'a pas de `DataTable` pour la porter. */
function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="sr-only">Rechercher un chantier</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher un code, un intitulé…"
        className={cn(
          "w-full rounded-sm border-0 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-900",
          "ring-1 ring-inset ring-slate-300 transition-shadow",
          "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600",
          "dark:text-slate-100 dark:ring-slate-600 dark:placeholder:text-slate-500",
        )}
      />
    </label>
  );
}

function ViewToggle({ view, onChange }: { view: string; onChange: (view: string) => void }) {
  const options = [
    { value: "cards", label: "Cartes" },
    { value: "table", label: "Tableau" },
  ];

  return (
    <div
      role="group"
      aria-label="Affichage des chantiers"
      className="inline-flex shrink-0 overflow-hidden rounded-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-2 text-xs font-medium transition-colors",
            view === option.value
              ? "grad-brand text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  canManage,
  onEdit,
  onDelete,
}: {
  project: Project;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-sm border border-slate-200 bg-[var(--surface)] p-4 transition-shadow hover:shadow-card dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400"
          >
            {project.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {project.code}
          </p>
        </div>
        {project.is_active ? (
          <Badge tone="success">En cours</Badge>
        ) : (
          <Badge tone="neutral">Clos</Badge>
        )}
      </div>

      <dl className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-400">Maître d&apos;ouvrage</dt>
          <dd className="truncate text-slate-700 dark:text-slate-200">
            {project.client_name ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-400">Créé le</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-200">
            {formatDate(project.created_at)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <LinkButton
          size="sm"
          href={`/projects/${project.id}`}
          icon={<IconPurchaseOrder className="h-3.5 w-3.5" />}
        >
          Détail
        </LinkButton>
        {canManage ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              icon={<IconPencil className="h-3.5 w-3.5" />}
            >
              Modifier
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onDelete}
              icon={<IconTrash className="h-3.5 w-3.5" />}
            >
              Supprimer
            </Button>
          </>
        ) : null}
      </div>
    </li>
  );
}
