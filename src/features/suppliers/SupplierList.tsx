"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Badge, Button, ConfirmDialog, DataTable, LinkButton, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconExternal, IconPencil, IconPlus, IconTrash } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation } from "@/hooks/useMutation";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { formatDate } from "@/lib/format";
import { referenceService } from "@/services";
import type { Supplier } from "@/types/api";
import { SupplierFormDialog } from "./SupplierFormDialog";

const STATE_OPTIONS = [
  { value: "", label: "Actifs et inactifs" },
  { value: "1", label: "Actifs seulement" },
  { value: "0", label: "Inactifs seulement" },
];

/**
 * Referentiel fournisseurs.
 *
 * C'est le point d'entree du circuit : sans fournisseur, pas de bon de
 * commande, donc pas de rapprochement possible. L'ecran expose donc les quatre
 * gestes complets — consulter, creer, modifier, supprimer — mais la
 * suppression est volontairement la moins engageante des quatre : elle echoue
 * des qu'un document cite la fiche, et l'ecran le dit avant l'API.
 */
export function SupplierList() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<Supplier | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      referenceService.listSuppliers({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        is_active: state === "" ? undefined : state === "1",
        ...sortParams,
      }),
    [debouncedSearch, state, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<Supplier>(fetcher);

  const deleteAction = useCallback((id: number) => referenceService.removeSupplier(id), []);
  const deletion = useMutation(deleteAction);

  const canManage = can("procurement.manage");

  async function confirmDeletion() {
    if (!pendingDeletion) return;

    // `run` renvoie `undefined` sur succes (204 sans corps) et `null` sur
    // echec : on distingue les deux explicitement plutot que par verite.
    const result = await deletion.run(pendingDeletion.id);
    if (result !== null) {
      setPendingDeletion(null);
      reload();
    }
  }

  const columns: Array<Column<Supplier>> = [
    {
      key: "code",
      header: "Code",
      sortKey: "code",
      cell: (supplier) => (
        <Link
          href={`/suppliers/${supplier.id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {supplier.code}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Raison sociale",
      sortKey: "name",
      cell: (supplier) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{supplier.name}</span>
      ),
    },
    {
      key: "email",
      header: "Facturation",
      sortKey: "email",
      cell: (supplier) => (
        <span className="text-slate-600 dark:text-slate-300">{supplier.email ?? "—"}</span>
      ),
    },
    {
      key: "vat_number",
      header: "TVA",
      cell: (supplier) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {supplier.vat_number ?? "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "État",
      sortKey: "is_active",
      cell: (supplier) =>
        supplier.is_active ? (
          <Badge tone="success">Actif</Badge>
        ) : (
          <Badge tone="neutral">Inactif</Badge>
        ),
    },
    {
      key: "created_at",
      header: "Créé le",
      sortKey: "created_at",
      cell: (supplier) => formatDate(supplier.created_at),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (supplier) => (
        <div className="flex justify-end gap-2">
          <LinkButton
            size="sm"
            href={`/suppliers/${supplier.id}`}
            icon={<IconExternal className="h-3.5 w-3.5" />}
          >
            Détail
          </LinkButton>
          {canManage ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditing(supplier);
                  setIsFormOpen(true);
                }}
                icon={<IconPencil className="h-3.5 w-3.5" />}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  deletion.reset();
                  setPendingDeletion(supplier);
                }}
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
            Créer un fournisseur
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(supplier) => supplier.id}
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
        emptyTitle="Aucun fournisseur"
        emptyDescription="Aucune fiche ne correspond à ce filtre."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher un code, une raison sociale…",
          label: "Rechercher un fournisseur",
        }}
        toolbar={
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
        }
      />

      {canManage ? (
        <>
          <SupplierFormDialog
            // Remonte le formulaire a chaque ouverture : editer une seconde
            // fiche doit repartir de ses valeurs, pas de celles de la premiere.
            key={`${isFormOpen}-${editing?.id ?? "new"}`}
            supplier={editing}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSaved={reload}
          />

          <ConfirmDialog
            isOpen={pendingDeletion !== null}
            onClose={() => setPendingDeletion(null)}
            onConfirm={confirmDeletion}
            title="Supprimer ce fournisseur ?"
            description={
              pendingDeletion ? `${pendingDeletion.code} — ${pendingDeletion.name}` : undefined
            }
            confirmLabel="Supprimer définitivement"
            confirmIcon={<IconTrash className="h-4 w-4" />}
            isPending={deletion.isPending}
            error={deletion.error}
            errorFallback="La suppression a échoué."
          >
            La suppression n&apos;est possible que si aucun bon de commande et aucune facture ne
            citent ce fournisseur. Sinon, désactivez-le : il quitte les listes de saisie sans que
            les décisions déjà archivées perdent leur émetteur.
          </ConfirmDialog>
        </>
      ) : null}
    </div>
  );
}
