import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonClasses } from "./Button";
import type { ButtonSize, ButtonVariant } from "./Button";

export interface LinkButtonProps extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Lien de navigation habille en bouton.
 *
 * Un `<button onClick={() => router.push(...)}>` aurait la meme apparence et
 * couterait trois comportements : le clic milieu, « ouvrir dans un nouvel
 * onglet », et l'apercu de l'URL au survol. Sur un ecran de consultation ou
 * l'on compare deux fiches cote a cote, ces trois-la comptent.
 */
export function LinkButton({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
