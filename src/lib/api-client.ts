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

/**
 * Réaction à un token refusé par l'API.
 *
 * Les jetons ont une durée de vie bornée côté backend
 * (`SANCTUM_TOKEN_EXPIRATION`). Une fois ce délai passé, chaque requête revient
 * en 401 : sans traitement central, l'utilisateur verrait toutes ses listes se
 * remplir de messages d'erreur en restant, en apparence, connecté. Le token est
 * donc effacé ici — au seul endroit qui voit passer toutes les réponses — et
 * l'abonné (le contexte d'authentification) referme la session.
 *
 * Un 401 sans token envoyé n'est pas une expiration mais une simple visite
 * anonyme : il ne déclenche rien.
 */
type UnauthenticatedListener = () => void;

let unauthenticatedListener: UnauthenticatedListener | null = null;

/** Abonne l'application aux jetons refusés. Renvoie de quoi se désabonner. */
export function onUnauthenticated(listener: UnauthenticatedListener): () => void {
  unauthenticatedListener = listener;

  return () => {
    if (unauthenticatedListener === listener) unauthenticatedListener = null;
  };
}

function handleRefusedToken(sentToken: string | null): void {
  if (sentToken === null) return;

  clearToken();
  unauthenticatedListener?.();
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
    if (response.status === 401) handleRefusedToken(token);

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

/**
 * Telecharge un fichier servi par l'API.
 *
 * Un `<a href>` ne conviendrait pas : le token d'authentification voyage dans
 * un en-tete, pas dans l'URL, et un lien nu recevrait un 401. On recupere donc
 * le flux, puis on declenche l'enregistrement depuis un URL objet local.
 *
 * Le nom de fichier propose par le serveur (`Content-Disposition`) est
 * privilegie : c'est lui qui porte la reference du document, et un
 * « telechargement.pdf » dans un dossier de comptabilite ne se retrouve pas.
 */
export async function apiDownload(path: string, fallbackFilename: string): Promise<void> {
  const requestHeaders = new Headers({ Accept: "application/pdf" });
  const token = readToken();
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(buildUrl(path), { headers: requestHeaders });
  } catch (cause) {
    throw new NetworkError(cause);
  }

  if (!response.ok) {
    if (response.status === 401) handleRefusedToken(token);

    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(response.status, errorBody);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filenameFrom(response.headers.get("Content-Disposition")) ?? fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Liberer l'URL objet : sans cela le blob reste en memoire tant que l'onglet
  // est ouvert, ce qui se voit vite sur un ecran ou l'on exporte en serie.
  URL.revokeObjectURL(objectUrl);
}

function filenameFrom(disposition: string | null): string | null {
  if (!disposition) return null;

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) return decodeURIComponent(utf8[1]);

  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}
