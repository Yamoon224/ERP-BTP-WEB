"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { floatingControlClasses, visiblePlaceholderClasses } from "./Field";
import { IconEye, IconEyeOff, IconSearch } from "./icons";

/**
 * Controles de saisie nus. Ils ne portent aucun contour : celui-ci est dessine
 * par la coquille `FieldShell` qui les enveloppe, ce qui garantit qu'il n'y en
 * a jamais deux.
 *
 * Un placeholder reste obligatoire cote appelant : c'est lui qui alimente
 * `:placeholder-shown`, la pseudo-classe qui fait monter le libelle. Sans lui,
 * le libelle resterait colle au centre du champ meme une fois rempli.
 */

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, placeholder, ...props }, ref) {
    return (
      <input
        ref={ref}
        placeholder={placeholder ?? " "}
        className={cn(floatingControlClasses, className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, placeholder, rows = 3, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder ?? " "}
        className={cn(floatingControlClasses, "resize-y", className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(floatingControlClasses, "cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

/**
 * Champ de mot de passe avec bascule d'affichage.
 *
 * Le libelle du bouton est volontairement ecrit en minuscules (« afficher le
 * mot de passe en clair ») : c'est une action, pas un second champ, et cela
 * evite qu'une recherche par libelle tombe sur deux elements.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, placeholder, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <>
        <input
          ref={ref}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder ?? " "}
          className={cn(floatingControlClasses, "pr-11", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-pressed={isVisible}
          aria-label={
            isVisible ? "masquer le mot de passe en clair" : "afficher le mot de passe en clair"
          }
          title={isVisible ? "Masquer" : "Afficher"}
          className="absolute inset-y-0 right-0 z-[2] flex w-10 items-center justify-center rounded-r-sm text-slate-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
        >
          {isVisible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </>
    );
  },
);

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

/**
 * Recherche : le seul champ dont le placeholder reste visible en permanence.
 * Un libelle flottant au-dessus d'une loupe n'apporterait rien — l'icone dit
 * deja ce que fait le champ — et volerait de la hauteur au tableau.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ className, label = "Rechercher", placeholder, ...props }, ref) {
    return (
      <div className="relative w-full">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={ref}
          type="search"
          aria-label={label}
          placeholder={placeholder ?? "Rechercher…"}
          className={cn(visiblePlaceholderClasses, "pl-9", className)}
          {...props}
        />
      </div>
    );
  },
);
