import { cn } from "@/lib/cn";

/** Deux initiales au plus : au-dela, la pastille devient illisible. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

  return `${first}${last}`.toUpperCase();
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

/**
 * Photo de profil, avec repli sur les initiales.
 *
 * L'API ne porte pas encore d'avatar : plutot que d'afficher une silhouette
 * generique identique pour tous, on derive les initiales du nom, ce qui rend
 * chaque utilisateur reconnaissable des le premier coup d'oeil.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grad-brand relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm font-semibold text-white ring-1 ring-white/25",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar distant, dimensions fixes
        <img src={src} alt={`Photo de profil de ${name}`} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
