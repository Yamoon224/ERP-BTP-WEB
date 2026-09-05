import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";
import { THEME_STORAGE_KEY } from "./theme-constants";

/**
 * jsdom n'implemente pas `matchMedia` : le mode « systeme » n'a donc de sens
 * dans un test que si on lui fournit une preference systeme simulee.
 */
function stubSystemPreference(prefersDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: prefersDark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle showLabels />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    vi.unstubAllGlobals();
  });

  it("propose les trois modes et démarre en clair", () => {
    renderToggle();

    expect(screen.getByRole("radio", { name: "Clair" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Sombre" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Système" })).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("bascule en sombre et retient le choix", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("radio", { name: "Sombre" }));

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("suit la préférence du système quand le mode « système » est choisi", async () => {
    // Poste regle en sombre : « systeme » doit produire un affichage sombre
    // sans que l'utilisateur ait choisi « sombre ».
    stubSystemPreference(true);

    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("radio", { name: "Système" }));

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("reste clair en mode « système » sur un poste réglé en clair", async () => {
    stubSystemPreference(false);

    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("radio", { name: "Système" }));

    await waitFor(() =>
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system"),
    );
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("repart du choix mémorisé au chargement suivant", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    renderToggle();

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(screen.getByRole("radio", { name: "Sombre" })).toBeChecked();
  });
});
