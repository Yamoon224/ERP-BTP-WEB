"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, clearToken } from "@/lib/api-client";
import { authService } from "@/services";
import type { User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  /** Vrai tant que la session initiale n'a pas été vérifiée auprès de l'API. */
  isInitialising: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Relit la session aupres de l'API. A appeler apres avoir modifie son
   * propre profil : le nom et l'adresse sont affiches dans l'en-tete et la
   * barre laterale, qui se contrediraient sinon jusqu'au rechargement.
   */
  refresh: () => Promise<void>;
  /**
   * Le frontend ne décide de rien : il masque simplement ce que l'utilisateur
   * ne peut pas faire, pour éviter des 403 prévisibles. L'autorisation réelle
   * reste appliquée côté backend, sur chaque route.
   */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);

  // Un token peut survivre à la fermeture du navigateur : on le confronte à
  // l'API au démarrage plutôt que de faire confiance au stockage local.
  useEffect(() => {
    let active = true;

    authService
      .me()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.isUnauthenticated) clearToken();
      })
      .finally(() => {
        if (active) setIsInitialising(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authService.login({ email, password }));
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    setUser(await authService.me());
  }, []);

  const can = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isInitialising, login, logout, refresh, can }),
    [user, isInitialising, login, logout, refresh, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }

  return context;
}
