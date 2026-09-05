import type { NextConfig } from "next";

/**
 * Le build de production local n'ecrit pas dans le meme dossier que le serveur
 * de developpement.
 *
 * `next build` (joue par `npm run check`) deposait sinon ses manifestes de
 * production a la racine de `.next`, ou `next dev` va aussi lire : le worker
 * de rendu repartait alors sur des artefacts qui ne sont pas les siens et
 * mourait sur les routes dynamiques (« Jest worker encountered N child process
 * exceptions »), alors que les routes statiques, deja compilees, continuaient
 * de repondre. Deux dossiers distincts rendent la collision impossible.
 *
 * Vercel est la seule exception : son builder lit la sortie dans `.next` et
 * echoue avec « The Next.js output directory ".next" was not found » si on la
 * deplace. Aucun `next dev` ne tourne sur la machine de build, la collision
 * qu'on evite en local n'y existe donc pas.
 */
const isVercelBuild = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  distDir:
    process.env.NODE_ENV === "production" && !isVercelBuild
      ? ".next-build"
      : ".next",
};

export default nextConfig;
