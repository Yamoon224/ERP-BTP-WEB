import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Meme alias que tsconfig : les tests importent exactement comme le code.
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    /*
     * Les tests d'interface attendent des rendus asynchrones derriere de vraies
     * requetes simulees. Le defaut de 5 s suffit fichier par fichier, mais la
     * suite complete monte une trentaine d'environnements jsdom en parallele :
     * sur une machine chargee, une attente legitime depassait le delai et
     * faisait echouer un test qui passe seul. Le seuil n'est pas la pour
     * masquer un test lent, il est la pour que la suite mesure le code plutot
     * que la charge de la machine.
     */
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/app/**/layout.tsx", "src/types/**"],
    },
  },
});
