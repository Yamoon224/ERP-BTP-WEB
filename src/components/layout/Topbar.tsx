"use client";

import { usePathname } from "next/navigation";
import { IconMenu } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/features/auth/AuthContext";
import { CollapseHandle } from "./CollapseHandle";
import { NAV_ITEMS } from "./nav-config";
import { UserMenu } from "./UserMenu";

/**
 * En-tete applicatif : ou l'on est, comment on regle l'affichage, qui l'on est.
 * Il reste colle en haut parce que la deconnexion et le changement de theme
 * doivent etre atteignables sans remonter un tableau de 100 lignes.
 *
 * Il porte aussi la poignee de repli de la barre laterale, posee sur son bord
 * gauche : c'est le point ou se croisent la separation verticale (barre /
 * contenu) et la separation horizontale (bandeau / contenu).
 */
export function Topbar({
  onOpenNavigation,
  isSidebarCollapsed,
  onToggleSidebar,
}: {
  onOpenNavigation: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-[var(--surface)]/85 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800">
      <CollapseHandle isCollapsed={isSidebarCollapsed} onToggle={onToggleSidebar} />

      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Ouvrir la navigation"
          className="rounded-sm p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            {current?.label ?? "Mon profil"}
          </p>
          <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
            {current?.description ?? "Compte et préférences d'affichage"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle className="hidden sm:inline-flex" />
        <UserMenu />
      </div>
    </header>
  );
}
