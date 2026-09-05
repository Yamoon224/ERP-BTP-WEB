import { Card, CardBody } from "@/components/ui";
import { IconShield } from "@/components/ui/icons";
import { LogoMark } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata = { title: "Connexion — ERP BTP" };

const PILLARS = [
  {
    title: "Bon de commande",
    text: "Ce qui a été engagé auprès du fournisseur, en quantité et en prix.",
  },
  { title: "Bon de livraison", text: "Ce qui est réellement arrivé et a été accepté." },
  { title: "Facture", text: "Ce qui est réclamé — et ce qui, seul, devient payable." },
];

/**
 * Ecran de connexion en deux volets : 7/12 d'illustration, 5/12 de formulaire.
 *
 * L'illustration disparait sous `lg` plutot que de retrecir : sur un telephone,
 * un decor de 40 % de hauteur repousserait le formulaire sous la ligne de
 * flottaison, ce qui est le contraire du service rendu.
 */
export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-12">
      <section className="relative hidden overflow-hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-900 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-bg.svg')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/40 to-slate-950/80"
        />

        <div className="relative p-10">
          <LogoMark size="md" />
        </div>

        <div className="relative max-w-xl p-10 pb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
            Contrôle des règlements fournisseurs
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white">
            Aucun Fcfa ne part sans ses trois preuves.
          </h2>
          <span aria-hidden="true" className="mt-5 block h-[3px] w-20 rounded-full bg-blue-300" />

          <ul className="mt-8 flex flex-col gap-4">
            {PILLARS.map((pillar, index) => (
              <li key={pillar.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/12 text-sm font-semibold text-blue-100 ring-1 ring-white/25">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{pillar.title}</span>
                  <span className="block text-sm text-blue-100/80">{pillar.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-10 flex items-center gap-2 text-xs text-blue-100/70">
            <IconShield className="h-4 w-4" />
            Chaque décision est horodatée, nominative et rejouable.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-5 py-12 sm:px-10 lg:col-span-5 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <Card>
            <CardBody className="px-6 py-8 sm:px-8">
              <div className="flex flex-col items-center text-center">
                <LogoMark size="lg" />
                <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Connexion
                </h1>
                <span
                  aria-hidden="true"
                  className="grad-brand mt-2.5 block h-[3px] w-14 rounded-full"
                />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Rapprochement à 3 voies — accès réservé aux comptes autorisés.
                </p>
              </div>

              <div className="mt-8">
                <LoginForm />
              </div>
            </CardBody>
          </Card>

          <div className="mt-6 flex flex-col items-center gap-3">
            <ThemeToggle showLabels />
            <p className="text-center text-xs text-slate-400">
              ERP BTP — contrôle des règlements fournisseurs
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
