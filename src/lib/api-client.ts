import { config } from "./config";

/**
 * Point de passage unique vers l'API Laravel.
 *
 * Toute la communication réseau transite par ici : aucun composant n'appelle
 * `fetch` directement. Cela concentre en un seul endroit l'URL de base,
 * l'injection du token, la sérialisation JSON et — surtout — la traduction des
 * erreurs HTTP en erreurs typées que l'interface sait présenter.
 */

/** Forme d'erreur garantie par le backend (voir bootstrap/app.php). */
export interface ApiErrorBody {
  message: string;
  error_code: string;
  context?: Record<string, unknown>;
  /** Présent uniquement sur les erreurs de validation (422). */
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
  ) {
    super(body?.message ?? `Erreur API ${status}`);
    this.name = "ApiError";
  }

  /** Code applicatif stable, sur lequel l'interface peut brancher un comportement. */
  get code(): string {
    return this.body?.error_code ?? "unknown_error";
  }

  /** Erreurs de validation par champ, prêtes pour un formulaire. */
  get fieldErrors(): Record<string, string[]> {
    return this.body?.errors ?? {};
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/** Erreur réseau : le serveur n'a pas répondu du tout. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("Impossible de joindre l'API. Vérifiez que le backend est démarré.");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(config.tokenStorageKey);
  } catch {
    // Navigation privée ou stockage bloqué : on continue en anonyme plutôt
    // que de faire tomber l'application entière.
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    window.localStorage.setItem(config.tokenStorageKey, token);
  } catch {
    // Sans persistance, la session ne survivra pas au rechargement — ce n'est
    // pas une raison d'interrompre la connexion en cours.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(config.tokenStorageKey);
  } catch {
    /* idem */
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Corps sérialisé en JSON automatiquement. */
  body?: unknown;
  /** Paramètres de requête ; les valeurs vides sont ignorées. */
  query?: Record<string, string | number | boolean | null | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${config.apiUrl}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");

  const token = readToken();
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // Distinguer « le serveur a refusé » de « le serveur est injoignable » :
    // les deux appellent des messages très différents côté utilisateur.
    throw new NetworkError(cause);
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** Message lisible pour n'importe quelle erreur remontée par la couche API. */
export function errorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
