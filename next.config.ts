import type { NextConfig } from "next";

/**
 * Le build de production n'ecrit pas dans le meme dossier que le serveur de
 * developpement.
 *
 * `next build` (joue par `npm run check`) deposait sinon ses manifestes de
 * production a la racine de `.next`, ou `next dev` va aussi lire : le worker
 * de rendu repartait alors sur des artefacts qui ne sont pas les siens et
 * mourait sur les routes dynamiques (« Jest worker encountered N child process
 * exceptions »), alors que les routes statiques, deja compilees, continuaient
 * de repondre. Deux dossiers distincts rendent la collision impossible.
 */
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
};

export default nextConfig;
