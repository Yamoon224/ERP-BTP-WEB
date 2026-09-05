import type { ReactNode } from "react";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

/** Paires libelle/valeur pour les fiches de detail. */
export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
