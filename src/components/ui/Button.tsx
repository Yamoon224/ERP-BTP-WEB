import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "icon";

/**
 * Le bleu de marque n'apparait qu'en degrade diagonal, jamais en aplat : c'est
 * ce qui rend l'action principale reconnaissable d'un ecran a l'autre.
 */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "grad-brand text-white shadow-sm hover:grad-brand-hover hover:shadow-md active:translate-y-px",
  secondary:
    "bg-[var(--surface)] text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:text-blue-700 hover:ring-blue-300 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800 dark:hover:text-blue-300 dark:hover:ring-blue-700",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:translate-y-px disabled:hover:bg-rose-600",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  icon: "h-8 w-8",
};

/**
 * Habillage partage par le bouton et par le lien qui doit lui ressembler.
 *
 * Un lien de navigation ne doit pas etre un `<button>` avec un `onClick` qui
 * change `location` : le clic milieu, l'ouverture dans un onglet et le survol
 * d'URL disparaitraient. `LinkButton` reutilise donc ces classes plutot que de
 * les recopier - sans quoi les deux finiraient par diverger d'un pixel.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center rounded-sm font-medium whitespace-nowrap",
    "transition-all duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
    "disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:active:translate-y-0",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

export type ButtonVariant = Variant;
export type ButtonSize = Size;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Affiche un etat d'attente et empeche la double soumission. */
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", isLoading = false, icon, children, className, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      // Desactive pendant l'attente : sur un ecran qui declenche des
      // rapprochements, un double clic creerait deux executions.
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {isLoading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}
