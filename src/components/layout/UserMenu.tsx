"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui";
import { IconChevronDown, IconLogout, IconUser } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/AuthContext";
import { roleLabel } from "@/lib/domain-labels";
import { cn } from "@/lib/cn";

/**
 * Photo de profil du header et menu associe.
 *
 * Le menu regroupe ce qui concerne la personne connectee - son profil, son
 * theme, sa deconnexion - pour que le reste de l'en-tete reste consacre au
 * contenu de l'ecran.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    router.replace("/login");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center gap-2 rounded-sm p-1 pr-2 transition-colors",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          isOpen && "bg-slate-100 dark:bg-slate-800",
        )}
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-36 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
            {user.name}
          </span>
          <span className="block max-w-36 truncate text-[11px] text-slate-500 dark:text-slate-400">
            {user.roles.map(roleLabel).join(", ")}
          </span>
        </span>
        <IconChevronDown
          className={cn(
            "h-3.5 w-3.5 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="animate-fade-rise absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-sm border border-slate-200 bg-[var(--surface)] shadow-card dark:border-slate-800"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <IconUser className="h-4 w-4 text-slate-400" />
            Mon profil
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <IconLogout className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}
