import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

/**
 * Socle commun aux tests frontend.
 *
 * Chaque test repart d'un DOM propre, d'un stockage local vide et d'un `fetch`
 * neuf : un test qui herite de l'etat du precedent finit toujours par passer ou
 * echouer pour de mauvaises raisons.
 */
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.localStorage.clear();
});

// jsdom n'implemente pas <dialog> : ces deux methodes suffisent aux tests des
// composants qui s'appuient dessus (Modal).
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
    };
  }
});
