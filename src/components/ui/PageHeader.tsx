import type { ReactNode } from "react";
import { TitleRule } from "./Card";

export function PageHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grad-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-white shadow-card">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {/* Le trait separe le titre de son sous-titre : la hierarchie se lit
              avant meme d'avoir lu les mots. */}
          <TitleRule className="w-16" />
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
