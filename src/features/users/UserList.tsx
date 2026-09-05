"use client";

import { useCallback, useState } from "react";
import { Avatar, Badge, Button, DataTable, FormAlert, Modal, SelectField } from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconPencil, IconPlus, IconTrash } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation } from "@/hooks/useMutation";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useSort } from "@/hooks/useSort";
import { errorMessage } from "@/lib/api-client";
import { ROLE_LABEL, roleLabel } from "@/lib/domain-labels";
import { formatDate } from "@/lib/format";
import { userService } from "@/services";
import type { AdminUser } from "@/types/api";
import { UserFormDialog } from "./UserFormDialog";

const ROLE_OPTIONS = [{ value: "", label: "Tous les rôles" }].concat(
  Object.keys(ROLE_LABEL).map((role) => ({ value: role, label: ROLE_LABEL[role] })),
);

/**
 * Administration des comptes.
 *
 * La separation des taches ne tient que si quelqu'un peut la maintenir : c'est
 * cet ecran. Il affiche les roles en clair plutot que leurs codes, parce que
 * c'est le role — pas l'identifiant technique — qui decide de ce qu'une
 * personne pourra faire du circuit de paiement.
 */
export function UserList() {
  const { user: currentUser, can } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<AdminUser | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { sort, setSort, sortParams } = useSort();

  const fetcher = useCallback(
    (page: number, perPage: number) =>
      userService.list({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        role: role || undefined,
        ...sortParams,
      }),
    [debouncedSearch, role, sortParams],
  );

  const { items, meta, setPage, setPerPage, isLoading, error, reload } =
    usePaginatedData<AdminUser>(fetcher);

  const deleteAction = useCallback((id: string) => userService.remove(id), []);
  const deletion = useMutation(deleteAction);

  const canManage = can("users.manage");

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

  const columns: Array<Column<AdminUser>> = [
    {
      key: "name",
      header: "Utilisateur",
      sortKey: "name",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
            {currentUser?.id === user.id ? (
              <p className="text-xs text-blue-600 dark:text-blue-400">Votre compte</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Adresse e-mail",
      sortKey: "email",
      cell: (user) => <span className="text-slate-600 dark:text-slate-300">{user.email}</span>,
    },
    {
      key: "roles",
      header: "Rôles",
      cell: (user) => (
        <div className="flex flex-wrap gap-1.5">
          {user.roles.length === 0 ? (
            <Badge tone="warning">Aucun rôle</Badge>
          ) : (
            user.roles.map((name) => (
              <Badge key={name} tone="info">
                {roleLabel(name)}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: "permissions",
      header: "Droits",
      cell: (user) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {user.permissions.length} droit{user.permissions.length > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Créé le",
      sortKey: "created_at",
      cell: (user) => formatDate(user.created_at),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: (user) =>
        canManage ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(user);
                setIsFormOpen(true);
              }}
              icon={<IconPencil className="h-3.5 w-3.5" />}
            >
              Modifier
            </Button>
            <Button
              size="sm"
              variant="danger"
              // Supprimer son propre compte reviendrait a se mettre dehors :
              // le backend le refuse, l'interface ne le propose meme pas.
              disabled={currentUser?.id === user.id}
              title={
                currentUser?.id === user.id
                  ? "Vous ne pouvez pas supprimer votre propre compte"
                  : undefined
              }
              onClick={() => {
                deletion.reset();
                setPendingDeletion(user);
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
            Créer un compte
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(user) => user.id}
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
        emptyTitle="Aucun compte"
        emptyDescription="Aucun utilisateur ne correspond à ce filtre."
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher un nom, un e-mail…",
          label: "Rechercher un utilisateur",
        }}
        toolbar={
          <SelectField
            label="Rôle"
            fieldClassName="w-full sm:w-56"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        }
      />

      {canManage ? (
        <>
          <UserFormDialog
            // Remonte le formulaire a chaque ouverture : editer un second
            // compte doit repartir de ses valeurs, pas de celles du premier.
            key={`${isFormOpen}-${editing?.id ?? "new"}`}
            user={editing}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSaved={reload}
          />

          <Modal
            isOpen={pendingDeletion !== null}
            onClose={() => setPendingDeletion(null)}
            title="Supprimer ce compte ?"
            description={
              pendingDeletion
                ? `${pendingDeletion.name} — ${pendingDeletion.email}`
                : undefined
            }
            footer={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPendingDeletion(null)}
                  disabled={deletion.isPending}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  isLoading={deletion.isPending}
                  onClick={confirmDeletion}
                  icon={<IconTrash className="h-4 w-4" />}
                >
                  Supprimer définitivement
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Le compte et ses sessions ouvertes sont supprimés. Les documents qu&apos;il a
                créés et les arbitrages qu&apos;il a rendus restent en base : une piste
                d&apos;audit qui perdrait ses auteurs ne vaudrait plus rien.
              </p>

              {deletion.error ? (
                <FormAlert>
                  {errorMessage(deletion.error, "La suppression a échoué.")}
                </FormAlert>
              ) : null}
            </div>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
