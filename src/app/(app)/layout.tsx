"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LoadingState } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { usePreference } from "@/hooks/usePreference";

const COLLAPSE_STORAGE_KEY = "erp_sidebar_collapsed";

/**
 * Coquille des ecrans authentifies.
 *
 * La redirection attend la fin de la verification de session : rediriger
 * pendant l'initialisation renverrait vers /login a chaque rechargement, meme
 * avec un token parfaitement valide.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialising } = useAuth();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // L'etat replie est une preference d'espace de travail : elle doit tenir
  // d'une session a l'autre, sinon l'utilisateur la repose a chaque visite.
  const [collapsed, setCollapsed] = usePreference(COLLAPSE_STORAGE_KEY, "0");
  const isCollapsed = collapsed === "1";

  const toggleCollapse = useCallback(
    () => setCollapsed(isCollapsed ? "0" : "1"),
    [isCollapsed, setCollapsed],
  );

  useEffect(() => {
    if (!isInitialising && user === null) router.replace("/login");
  }, [isInitialising, user, router]);

  if (isInitialising) return <LoadingState label="Vérification de la session…" />;
  if (user === null) return null;

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenNavigation={() => setIsMobileOpen(true)}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={toggleCollapse}
        />
        <main className="animate-fade-rise mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
