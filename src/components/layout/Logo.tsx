import { cn } from "@/lib/cn";
import { IconBilling } from "@/components/ui/icons";

const SIZE_CLASSES = {
  sm: "h-9 w-9 rounded-sm",
  md: "h-11 w-11 rounded-sm",
  lg: "h-14 w-14 rounded-sm",
} as const;

const ICON_CLASSES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
} as const;

/**
 * Marque de l'application : une facture, parce que c'est l'objet autour duquel
 * tourne tout le produit - ce qui est reclame, et que le rapprochement autorise
 * ou bloque.
 */
export function LogoMark({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grad-brand flex shrink-0 items-center justify-center text-white shadow-card",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <IconBilling className={ICON_CLASSES[size]} />
      <span className="sr-only">ERP BTP</span>
    </span>
  );
}

export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          ERP BTP
        </span>
        <span className="grad-brand-text block truncate text-sm font-semibold">
          Rapprochement 3 voies
        </span>
      </span>
    </span>
  );
}
