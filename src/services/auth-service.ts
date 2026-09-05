import { apiFetch, clearToken, storeToken } from "@/lib/api-client";
import type { Single, User } from "@/types/api";

export interface Credentials {
  email: string;
  password: string;
}

interface LoginResponse {
  data: { token: string; user: User };
}

/**
 * Le token est persiste ici et nulle part ailleurs : c'est le seul endroit du
 * frontend qui sait comment une session commence et se termine.
 */
export async function login(credentials: Credentials): Promise<User> {
  const response = await apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: { ...credentials, device_name: "web" },
  });

  storeToken(response.data.token);

  return response.data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/logout", { method: "POST" });
  } finally {
    // Le token local est efface meme si l'appel echoue : rester "connecte"
    // dans l'interface avec un token que le serveur a deja revoque serait pire
    // que la deconnexion elle-meme.
    clearToken();
  }
}

export async function me(): Promise<User> {
  const response = await apiFetch<Single<User>>("/me");

  return response.data;
}
