import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "./Badge";

const TONE_ACCENT: Record<Tone, string> = {
  neutral: "text-slate-900 dark:text-slate-50",
  info: "text-blue-700 dark:text-blue-400",
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-rose-700 dark:text-rose-400",
};

const TONE_ICON: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  info: "grad-brand-soft text-blue-600 dark:text-blue-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-[var(--surface)] shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800">
      <div className="flex flex-1 items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={cn("mt-2 text-2xl font-semibold tabular-nums", TONE_ACCENT[tone])}>
            {value}
          </p>
          {hint ? (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm transition-transform duration-200 group-hover:scale-105",
              TONE_ICON[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <span aria-hidden="true" className="grad-brand h-[3px] w-full" />
    </div>
  );
}
