import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncData } from "./useAsyncData";

/** Promesse dont on contrôle la résolution, pour tester les courses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useAsyncData", () => {
  it("part en chargement puis expose la donnée", async () => {
    const loader = vi.fn(() => Promise.resolve("résultat"));
    const { result } = renderHook(() => useAsyncData(loader));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("résultat");
    expect(result.current.error).toBeNull();
  });

  it("expose l'erreur sans laisser l'écran en chargement perpétuel", async () => {
    const failure = new Error("panne");
    const loader = vi.fn(() => Promise.reject(failure));
    const { result } = renderHook(() => useAsyncData(loader));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeNull();
  });

  it("relance le chargement à la demande", async () => {
    const loader = vi.fn(() => Promise.resolve("valeur"));
    const { result } = renderHook(() => useAsyncData(loader));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(loader).toHaveBeenCalledTimes(1);

    act(() => result.current.reload());

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it("ignore la réponse d'une requête devenue obsolète", async () => {
    // Scénario réel : l'utilisateur change de filtre pendant qu'une requête
    // lente est en vol. C'est la dernière DEMANDÉE qui doit gagner, pas la
    // dernière ARRIVÉE.
    const slow = deferred<string>();
    const fast = deferred<string>();

    const firstLoader = vi.fn(() => slow.promise);
    const secondLoader = vi.fn(() => fast.promise);

    const { result, rerender } = renderHook(({ loader }) => useAsyncData(loader), {
      initialProps: { loader: firstLoader },
    });

    rerender({ loader: secondLoader });

    await act(async () => {
      fast.resolve("second filtre");
      slow.resolve("premier filtre");
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("second filtre");
  });

  it("ne sert pas les données du filtre précédent pendant le rechargement", async () => {
    const first = deferred<string>();
    const second = deferred<string>();

    const { result, rerender } = renderHook(({ loader }) => useAsyncData(loader), {
      initialProps: { loader: () => first.promise },
    });

    await act(async () => {
      first.resolve("données A");
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.data).toBe("données A"));

    rerender({ loader: () => second.promise });

    // La nouvelle requête n'a pas répondu : mieux vaut ne rien montrer que
    // d'afficher les résultats de l'ancien filtre sous le nouveau libellé.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });
});
