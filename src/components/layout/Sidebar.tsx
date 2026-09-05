"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { Avatar } from "@/components/ui";
import { IconClose, IconUser } from "@/components/ui/icons";
import { Logo, LogoMark } from "./Logo";
import { NAV_ITEMS } from "./nav-config";

export interface SidebarProps {
  isCollapsed: boolean;
  /** Ouverture du tiroir sur mobile — la barre est hors flux en dessous de md. */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Barre de navigation laterale, reductible.
 *
 * Reduite, elle ne garde que les icones : sur un tableau de rapprochement qui
 * compte une dizaine de colonnes, les 17 rem rendues a la zone de travail
 * changent la lisibilite. Le libelle reste accessible au survol (title) et aux
 * lecteurs d'ecran (texte hors ecran), donc rien n'est perdu.
 *
 * La commande de repli ne vit pas ici mais sur la ligne qui separe la barre du
 * bandeau superieur (voir `CollapseHandle`) : elle designe ainsi la frontiere
 * qu'elle deplace, au lieu d'occuper une ligne de menu de plus.
 */
export function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, can } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <>
      {/* Voile mobile : ferme le tiroir au clic, sans piéger l'utilisateur. */}
      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Fermer la navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <nav
        aria-label="Navigation principale"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-slate-200 bg-[var(--surface)]",
          "transition-[width,transform] duration-200 ease-out dark:border-slate-800",
          // Le z-40 ne sert qu'au tiroir mobile, qui doit passer au-dessus du
          // voile. Sur grand ecran il redescend, sinon la barre recouvrirait la
          // moitie gauche de la poignee de repli posee sur son bord.
          "md:sticky md:top-0 md:z-10 md:translate-x-0",
          isCollapsed ? "w-[4.5rem]" : "w-[17rem]",
          isMobileOpen ? "translate-x-0 shadow-card" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-slate-200 px-3 dark:border-slate-800",
            isCollapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {isCollapsed ? (
            <LogoMark size="sm" />
          ) : (
            <Link href="/dashboard" className="min-w-0 rounded-sm" onClick={onCloseMobile}>
              <Logo size="sm" />
            </Link>
          )}

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fermer la navigation"
            className="rounded-sm p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <IconClose />
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? item.label : undefined}
                  onClick={onCloseMobile}
                  className={cn(
                    "group relative flex items-center rounded-sm text-sm transition-colors",
                    isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "grad-brand-soft font-semibold text-blue-700 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
                  )}
                >
                  {/* Rappel de marque sur l'entree courante : un liseré vertical
                      se repère plus vite qu'une nuance de fond. */}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="grad-brand absolute inset-y-1 left-0 w-[3px] rounded-full"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-transform",
                      isActive ? "text-blue-600 dark:text-blue-400" : "group-hover:scale-110",
                    )}
                  />
                  <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="shrink-0 border-t border-slate-200 p-2.5 dark:border-slate-800">
          <Link
            href="/profile"
            onClick={onCloseMobile}
            title={isCollapsed ? "Mon profil" : undefined}
            className={cn(
              "flex items-center rounded-sm text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70",
              isCollapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-2",
            )}
          >
            {user ? (
              <Avatar name={user.name} size="sm" />
            ) : (
              <IconUser className="h-[18px] w-[18px]" />
            )}
            <span className={cn("min-w-0 flex-1", isCollapsed && "sr-only")}>
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {user?.name ?? "Mon profil"}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                Voir mon profil
              </span>
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
