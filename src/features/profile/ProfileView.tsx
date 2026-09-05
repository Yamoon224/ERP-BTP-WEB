"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { IconLogout, IconShield } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/features/auth/AuthContext";
import { roleLabel } from "@/lib/domain-labels";
import { filterBySearch } from "@/lib/search";
import { PasswordCard } from "./PasswordCard";
import { ProfileIdentityCard } from "./ProfileIdentityCard";

/** Traduction des prefixes de permission, cote metier plutot que technique. */
const DOMAIN_LABEL: Record<string, string> = {
  procurement: "Achats",
  receiving: "Réceptions",
  invoicing: "Facturation",
  matching: "Rapprochement",
  payments: "Paiements",
  reference: "Référentiel",
  users: "Utilisateurs",
};

const ACTION_LABEL: Record<string, string> = {
  view: "Consulter",
  manage: "Créer et modifier",
  run: "Déclencher",
  review: "Arbitrer",
};

interface PermissionRow {
  code: string;
  domain: string;
  action: string;
}

const PER_PAGE = 10;

/**
 * Page de profil.
 *
 * Elle repond a quatre questions concretes : qui suis-je pour l'application,
 * comment corriger cette identite, qu'ai-je le droit d'y faire, et comment
 * regler son affichage. Les droits sont montres en clair parce qu'un « acces
 * refuse » sans explication est la premiere cause d'appel au support sur ce
 * type d'outil.
 */
export function ProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const permissions = useMemo<PermissionRow[]>(() => {
    const rows = (user?.permissions ?? []).map((code) => {
      const [domain = code, action = ""] = code.split(".");
      return { code, domain, action };
    });

    return rows.sort((a, b) => a.code.localeCompare(b.code));
  }, [user]);

  const filtered = useMemo(
    () =>
      filterBySearch(permissions, search, (row) => [
        row.code,
        DOMAIN_LABEL[row.domain] ?? row.domain,
        ACTION_LABEL[row.action] ?? row.action,
      ]),
    [permissions, search],
  );

  if (!user) return null;

  const lastPage = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const columns: Array<Column<PermissionRow>> = [
    {
      key: "domain",
      header: "Domaine",
      cell: (row) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {DOMAIN_LABEL[row.domain] ?? row.domain}
        </span>
      ),
    },
    {
      key: "action",
      header: "Ce que cela autorise",
      cell: (row) => ACTION_LABEL[row.action] ?? row.action,
    },
    {
      key: "code",
      header: "Code technique",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <code className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {row.code}
        </code>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col items-center gap-5 px-5 py-6 sm:flex-row sm:items-start">
          <Avatar name={user.name} size="lg" />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {user.name}
            </h2>
            <span
              aria-hidden="true"
              className="grad-brand mx-auto mt-2 block h-[3px] w-14 rounded-full sm:mx-0"
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {user.roles.map((role) => (
                <Badge key={role} tone="info">
                  {roleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleLogout}
            icon={<IconLogout className="h-4 w-4" />}
          >
            Se déconnecter
          </Button>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* La cle repart du compte : recharger la session apres une
            modification remonte les valeurs enregistrees, sans effet de
            synchronisation. */}
        <ProfileIdentityCard key={`${user.id}-${user.name}-${user.email}`} user={user} />
        <PasswordCard />
      </div>

      <Card>
        <CardHeader
          title="Préférences d'affichage"
          description="Réglages propres à ce navigateur, conservés d'une session à l'autre."
          icon={<IconShield className="h-4 w-4" />}
        />
        <CardBody className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Thème</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              « Système » suit le réglage de votre poste et bascule avec lui.
            </p>
            <ThemeToggle showLabels className="mt-3" />
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Barre de navigation
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              La flèche posée sur la ligne qui sépare la barre latérale de l&apos;en-tête la
              réduit à ses icônes, et rend la largeur gagnée aux tableaux.
            </p>
          </div>
        </CardBody>
      </Card>

      <DataTable
        title="Droits accordés"
        description="Ce que votre compte peut faire. Tout le reste est refusé par le backend, quel que soit l'écran."
        icon={<IconShield className="h-4 w-4" />}
        columns={columns}
        rows={pageRows}
        getRowKey={(row) => row.code}
        emptyTitle="Aucun droit"
        emptyDescription="Ce compte ne peut consulter aucun module : contactez un administrateur."
        meta={{
          current_page: currentPage,
          last_page: lastPage,
          per_page: PER_PAGE,
          total: filtered.length,
        }}
        onPageChange={setPage}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Rechercher un droit…",
          label: "Rechercher un droit",
        }}
      />
    </div>
  );
}
