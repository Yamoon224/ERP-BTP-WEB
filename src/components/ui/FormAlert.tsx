import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconException } from "./icons";

export type AlertTone = "error" | "warning" | "success";

const TONE_CLASSES: Record<AlertTone, string> = {
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
};

/**
 * Message d'etat d'un formulaire ou d'une action.
 *
 * Factorise parce qu'il apparaissait a l'identique dans une demi-douzaine
 * d'ecrans : un bandeau d'erreur qui ne se ressemble pas d'un formulaire a
 * l'autre fait douter qu'il s'agisse du meme genre de probleme.
 */
export function FormAlert({
  tone = "error",
  children,
  className,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "success" ? IconCheck : IconException;

  return (
    <p
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-sm border px-3 py-2.5 text-sm",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
