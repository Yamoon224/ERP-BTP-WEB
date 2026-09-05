import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

/** Comportement du libelle selon le controle qu'il coiffe. */
export type FieldVariant = "input" | "textarea" | "select";

export interface FieldControlProps {
  id: string;
  className: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  variant?: FieldVariant;
  /** Element decoratif place a droite du controle (oeil, unite, chevron…). */
  adornment?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Habillage d'un controle : contour unique + libelle flottant.
 *
 * Le contour est porte par un `<fieldset>` pose par-dessus le controle, et non
 * par le controle lui-meme. Sa `<legend>` decoupe un vrai trou dans le trait
 * quand le libelle monte : il n'y a donc **aucune bordure a masquer** derriere
 * un fond opaque, et donc plus de « double trait » quand le fond du conteneur
 * differe de celui du champ (carte teintee, ligne de tableau, dialogue).
 *
 * Consequence directe : le controle n'a ni `border` ni `ring`. Une seule ligne
 * dessine le champ, dans tous ses etats.
 *
 * La legende reprend le libelle - texte invisible mais dimensionnant - pour que
 * l'encoche fasse exactement la largeur du mot qui s'y loge.
 */
export function FieldShell({
  id,
  label,
  required,
  variant = "input",
  adornment,
  className,
  children,
}: FieldShellProps) {
  return (
    <div
      className={cn("field-shell", variant === "textarea" && "field-shell--textarea", className)}
    >
      {children}

      <fieldset aria-hidden="true" className="field-outline">
        <legend>
          <span>
            {label}
            {required ? " *" : null}
          </span>
        </legend>
      </fieldset>

      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>

      {adornment ? (
        <div className="pointer-events-none absolute inset-y-0 right-1.5 z-[2] flex items-center">
          {adornment}
        </div>
      ) : null}
    </div>
  );
}

export interface FieldProps {
  label: string;
  /** Erreurs renvoyees par l'API pour ce champ. */
  errors?: string[];
  hint?: ReactNode;
  required?: boolean;
  variant?: FieldVariant;
  className?: string;
  adornment?: ReactNode;
  children: (props: FieldControlProps) => ReactNode;
}

/**
 * Enveloppe complete d'un champ : contour, libelle flottant, aide, erreurs.
 *
 * Le rendu par fonction transmet au controle son identifiant, sa classe
 * d'habillage et ses attributs d'accessibilite - de sorte que n'importe quel
 * element de saisie puisse prendre place dans la coquille.
 */
export function Field({
  label,
  errors,
  hint,
  required,
  variant,
  className,
  adornment,
  children,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = Boolean(errors?.length);

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <FieldShell id={id} label={label} required={required} variant={variant} adornment={adornment}>
        {children({
          id,
          className: controlClasses,
          "aria-invalid": hasError || undefined,
          "aria-describedby": hasError ? errorId : hint ? hintId : undefined,
        })}
      </FieldShell>

      {hint && !hasError ? (
        <p id={hintId} className="pl-0.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}

      {hasError ? (
        <p id={errorId} className="pl-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Habillage du controle. Volontairement reduit a une classe : toute la
 * mecanique (contour, encoche, montee du libelle) vit dans `globals.css`, ou
 * elle peut s'exprimer avec les combinateurs de voisinage qu'il faut.
 */
export const controlClasses = "field-control";

/** Conserve pour compatibilite avec les appelants existants. */
export const floatingControlClasses = controlClasses;

/**
 * Controle autonome, hors coquille flottante : recherche, filtres de barre
 * d'outils. Il porte son propre contour - un seul anneau, interieur, pour que
 * le passage de 1 a 2 pixels au focus ne decale rien.
 */
export const visiblePlaceholderClasses = cn(
  "w-full rounded-sm border-0 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-900",
  "ring-1 ring-inset ring-slate-300 transition-shadow",
  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
  "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600",
  "aria-[invalid=true]:ring-rose-500",
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
  "dark:text-slate-100 dark:ring-slate-600 dark:focus:ring-blue-500",
  "dark:disabled:bg-slate-800",
);
