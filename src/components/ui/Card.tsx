import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Carte : coins peu arrondis, ombre franche, liseré bleu en pied.
 *
 * Le liseré est un enfant de flux, pas un calque : il ne peut donc jamais
 * recouvrir la derniere ligne d'un tableau ou la barre de pagination.
 */
export function Card({
  children,
  className,
  accent = true,
}: {
  children: ReactNode;
  className?: string;
  /** Le liseré de marque, desactivable pour les cartes imbriquees. */
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-[var(--surface)]",
        "shadow-card transition-shadow duration-200 hover:shadow-card-hover",
        "dark:border-slate-800",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {accent ? <span aria-hidden="true" className="grad-brand h-[3px] w-full shrink-0" /> : null}
    </section>
  );
}

/** Trait de marque intercale entre un titre et son sous-titre. */
export function TitleRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grad-brand mt-2 block h-[3px] w-10 rounded-full", className)}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grad-brand-soft mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-blue-600 ring-1 ring-blue-500/20 dark:text-blue-400">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <TitleRule />
          {description ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
