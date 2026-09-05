"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { controlClasses } from "./Field";
import { IconChevronDown, IconSearch } from "./icons";

export interface ResourceOption {
  value: number;
  label: string;
  /** Deuxieme ligne : code, chantier, statut… ce qui departage deux homonymes. */
  hint?: string;
}

export interface ResourceSelectProps {
  label: string;
  placeholder: string;
  /**
   * Option retenue, en entier — pas seulement son identifiant. Le composant ne
   * garde donc aucune copie de la selection : le parent est seul a la detenir,
   * et une remise a zero de son cote se voit immediatement ici.
   */
  selected: ResourceOption | null;
  onChange: (option: ResourceOption) => void;
  /** Doit etre memorise (useCallback) : il declenche le chargement. */
  loadOptions: (search: string) => Promise<ResourceOption[]>;
  required?: boolean;
  disabled?: boolean;
  errors?: string[];
  hint?: ReactNode;
  className?: string;
  emptyLabel?: string;
}

/**
 * Selecteur d'une ressource distante (fournisseur, chantier, bon de commande).
 *
 * Un `<select>` classique supposerait de charger la liste entiere : avec 150
 * fournisseurs et autant de bons de commande, on demanderait a l'utilisateur
 * de derouler ce qu'il sait deja nommer. La recherche est donc servie par
 * l'API, avec une pause de frappe, et la liste ne montre que ce qui
 * correspond.
 *
 * L'element choisi reste affiche apres selection — pas seulement son
 * identifiant — pour qu'un formulaire relu avant envoi reste verifiable.
 */
export function ResourceSelect({
  label,
  placeholder,
  selected,
  onChange,
  loadOptions,
  required,
  disabled,
  errors,
  hint,
  className,
  emptyLabel = "Aucun résultat",
}: ResourceSelectProps) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query);
  const loader = useCallback(() => loadOptions(debouncedQuery), [loadOptions, debouncedQuery]);
  const { data, isLoading, error } = useAsyncData(loader);

  const options = useMemo(() => data ?? [], [data]);
  const hasError = Boolean(errors?.length);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const select = useCallback(
    (option: ResourceOption) => {
      setQuery("");
      setIsOpen(false);
      onChange(option);
    },
    [onChange],
  );

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} ref={containerRef}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-xs font-medium tracking-wide",
          hasError ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300",
        )}
      >
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : hint ? hintId : undefined}
          disabled={disabled}
          // La selection courante tient lieu de placeholder tant que rien
          // n'est tape : le champ reste relisible sans rien avoir a effacer.
          placeholder={selected ? selected.label : placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            controlClasses,
            "px-9",
            selected && query === "" &&
              "placeholder:font-medium placeholder:text-slate-900 dark:placeholder:text-slate-100",
          )}
        />
        <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        {isOpen ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-sm border border-slate-200 bg-[var(--surface)] py-1 shadow-card dark:border-slate-700"
          >
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Chargement…</li>
            ) : null}

            {!isLoading && error ? (
              <li className="px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                Le chargement a échoué.
              </li>
            ) : null}

            {!isLoading && !error && options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</li>
            ) : null}

            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === selected?.value}
                  onClick={() => select(option)}
                  className={cn(
                    "flex w-full flex-col items-start px-3 py-2 text-left transition-colors",
                    option.value === selected?.value
                      ? "grad-brand-soft text-blue-700 dark:text-blue-300"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {option.label}
                  </span>
                  {option.hint ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{option.hint}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

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
