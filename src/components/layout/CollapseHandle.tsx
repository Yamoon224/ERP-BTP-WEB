"use client";

import { cn } from "@/lib/cn";
import { IconChevronsLeft, IconChevronsRight } from "@/components/ui/icons";

/**
 * Poignee de repli de la barre laterale.
 *
 * Elle est posee sur l'intersection exacte des deux traits qui delimitent la
 * zone de travail : le bord droit de la barre laterale et le bas du bandeau
 * superieur. C'est la frontiere qu'elle deplace - un bouton pose ailleurs
 * demanderait d'apprendre ce qu'il fait, celui-ci le montre.
 *
 * La fleche pointe vers le mouvement a venir, pas vers l'etat courant :
 * deployee, elle indique la gauche (« replier ») ; reduite, la droite
 * (« deployer »).
 */
export function CollapseHandle({
  isCollapsed,
  onToggle,
  className,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const label = isCollapsed ? "Déployer la navigation" : "Réduire la navigation";
  const Chevron = isCollapsed ? IconChevronsRight : IconChevronsLeft;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isCollapsed}
      aria-label={label}
      title={label}
      className={cn(
        // Centree sur la ligne verticale (-translate-x-1/2) : la poignee
        // chevauche les deux cotes, ce qui la rattache visuellement a la
        // separation elle-meme plutot qu'a l'un des deux panneaux.
        "absolute left-0 top-1/2 z-30 hidden -translate-x-1/2 -translate-y-1/2 md:flex",
        "h-7 w-7 items-center justify-center rounded-full",
        "border border-slate-200 bg-[var(--surface)] text-slate-500 shadow-card",
        "transition-colors hover:border-blue-300 hover:text-blue-600",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        "dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:text-blue-300",
        className,
      )}
    >
      <Chevron className="h-3.5 w-3.5" />
    </button>
  );
}
