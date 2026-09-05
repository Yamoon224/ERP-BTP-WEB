import { vi } from "vitest";

/**
 * Faux serveur HTTP pour les tests d'intégration frontend.
 *
 * Les tests décrivent les réponses de l'API par (méthode, chemin) plutôt que
 * de moquer les modules de service : le code testé traverse ainsi toute la
 * chaîne réelle — service, client API, gestion d'erreur, composant — au lieu
 * de sauter la partie la plus susceptible de casser.
 */

export interface MockResponse {
  status?: number;
  body?: unknown;
}

type RouteKey = `${string} ${string}`;

export interface ApiMock {
  /** Enregistre une réponse pour « MÉTHODE /chemin » (chemin sans le préfixe d'API). */
  on: (route: RouteKey, response: MockResponse) => ApiMock;
  /** Appels reçus, dans l'ordre — pour vérifier ce qui a été envoyé. */
  calls: Array<{ method: string; path: string; body: unknown; headers: Headers }>;
}

export function mockApi(): ApiMock {
  const routes = new Map<string, MockResponse>();
  const calls: ApiMock["calls"] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost");
      const method = (init?.method ?? "GET").toUpperCase();
      // Le chemin est comparé sans le préfixe /api ni la query string, pour que
      // les tests restent lisibles.
      const path = url.pathname.replace(/^\/api/, "");

      calls.push({
        method,
        path: `${path}${url.search}`,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
        headers: new Headers(init?.headers),
      });

      const route = routes.get(`${method} ${path}`);

      if (!route) {
        return new Response(
          JSON.stringify({ message: `Route non simulée : ${method} ${path}`, error_code: "not_mocked" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      const status = route.status ?? 200;

      if (status === 204) return new Response(null, { status });

      return new Response(JSON.stringify(route.body ?? {}), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );

  const api: ApiMock = {
    on(route, response) {
      routes.set(route, response);
      return api;
    },
    calls,
  };

  return api;
}

/** Enveloppe paginée conforme au contrat de l'API. */
export function paginated<T>(items: T[], overrides: Partial<{ total: number; current_page: number; last_page: number; per_page: number }> = {}) {
  return {
    data: items,
    meta: {
      current_page: overrides.current_page ?? 1,
      last_page: overrides.last_page ?? 1,
      per_page: overrides.per_page ?? 15,
      total: overrides.total ?? items.length,
    },
  };
}

/**
 * Identifiant de test, derive d'un petit entier.
 *
 * Les cles de l'API sont des UUID : `id: 7` ne compile plus, et un UUID complet
 * recopie a la main dans quinze fixtures rendrait les tests illisibles — on ne
 * verrait plus lequel des trois documents est designe. Le numero reste donc
 * visible au bout de l'identifiant.
 */
export function testId(seed: number): string {
  return `00000000-0000-4000-8000-${String(seed).padStart(12, "0")}`;
}
