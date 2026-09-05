import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMutation } from "./useMutation";
import { ApiError } from "@/lib/api-client";

describe("useMutation", () => {
  it("renvoie le resultat et retombe au repos", async () => {
    const action = vi.fn(async (input: number) => input * 2);
    const { result } = renderHook(() => useMutation(action));

    expect(result.current.isPending).toBe(false);

    let value: number | null = null;
    await act(async () => {
      value = await result.current.run(21);
    });

    expect(value).toBe(42);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("renvoie null au lieu de rejeter, pour eviter un try/catch par formulaire", async () => {
    const failure = new Error("refus");
    const action = vi.fn(async () => {
      throw failure;
    });
    const { result } = renderHook(() => useMutation(action));

    let value: unknown = "non defini";
    await act(async () => {
      value = await result.current.run(undefined);
    });

    expect(value).toBeNull();
    expect(result.current.error).toBe(failure);
  });

  it("expose les erreurs de validation par champ", async () => {
    const action = vi.fn(async () => {
      throw new ApiError(422, {
        message: "Donnees invalides.",
        error_code: "validation_failed",
        errors: { note: ["Un motif est obligatoire."] },
      });
    });
    const { result } = renderHook(() => useMutation(action));

    await act(async () => {
      await result.current.run(undefined);
    });

    expect(result.current.fieldErrors.note).toEqual(["Un motif est obligatoire."]);
  });

  it("efface l'erreur precedente lors d'une nouvelle tentative", async () => {
    let shouldFail = true;
    const action = vi.fn(async () => {
      if (shouldFail) throw new Error("echec");
      return "ok";
    });
    const { result } = renderHook(() => useMutation(action));

    await act(async () => {
      await result.current.run(undefined);
    });
    expect(result.current.error).not.toBeNull();

    shouldFail = false;
    await act(async () => {
      await result.current.run(undefined);
    });
    expect(result.current.error).toBeNull();
  });

  it("remet l'etat a zero via reset", async () => {
    const action = vi.fn(async () => {
      throw new Error("echec");
    });
    const { result } = renderHook(() => useMutation(action));

    await act(async () => {
      await result.current.run(undefined);
    });
    act(() => result.current.reset());

    expect(result.current.error).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
  });
});
