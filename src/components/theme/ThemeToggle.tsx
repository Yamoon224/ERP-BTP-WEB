"use client";

import { cn } from "@/lib/cn";
import { IconMonitor, IconMoon, IconSun } from "@/components/ui/icons";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "./theme-constants";

const OPTIONS: Array<{ value: Theme; label: string; Icon: typeof IconSun }> = [
  { value: "light", label: "Clair", Icon: IconSun },
  { value: "dark", label: "Sombre", Icon: IconMoon },
  { value: "system", label: "Système", Icon: IconMonitor },
];

/**
 * Selecteur de theme a trois etats, montres simultanement.
 *
 * Un simple bouton bascule ne peut pas exprimer « suivre le systeme » : il
 * faut voir les trois choix pour comprendre lequel est actif.
 */
export function ThemeToggle({
  showLabels = false,
  className,
}: {
  showLabels?: boolean;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l'interface"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-sm border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "grad-brand text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {showLabels ? label : null}
          </button>
        );
      })}
    </div>
  );
}
