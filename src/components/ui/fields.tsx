"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Field } from "./Field";
import { Input, PasswordInput, Select, Textarea } from "./Input";
import { IconChevronDown } from "./icons";

/**
 * Champs prets a l'emploi : libelle flottant, placeholder, aide et erreurs.
 *
 * Le placeholder est un parametre **obligatoire** du type : une interface de
 * saisie ou l'on doit deviner le format attendu (« PO-2026-… », « 1250.00 »)
 * fait perdre plus de temps qu'elle n'en fait gagner, et l'oubli se voit ici a
 * la compilation plutot qu'en recette.
 */

interface CommonFieldProps {
  label: string;
  errors?: string[];
  hint?: ReactNode;
  /** Classe du bloc complet (libelle + controle + message). */
  fieldClassName?: string;
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "placeholder">,
    CommonFieldProps {
  placeholder: string;
}

export function TextField({
  label,
  errors,
  hint,
  fieldClassName,
  required,
  ...props
}: TextFieldProps) {
  return (
    <Field
      label={label}
      errors={errors}
      hint={hint}
      required={required}
      className={fieldClassName}
    >
      {(fieldProps) => <Input {...fieldProps} required={required} {...props} />}
    </Field>
  );
}

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "placeholder">,
    CommonFieldProps {
  placeholder: string;
}

export function PasswordField({
  label,
  errors,
  hint,
  fieldClassName,
  required,
  ...props
}: PasswordFieldProps) {
  return (
    <Field
      label={label}
      errors={errors}
      hint={hint}
      required={required}
      className={fieldClassName}
    >
      {(fieldProps) => <PasswordInput {...fieldProps} required={required} {...props} />}
    </Field>
  );
}

export interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "placeholder">,
    CommonFieldProps {
  placeholder: string;
}

export function TextareaField({
  label,
  errors,
  hint,
  fieldClassName,
  required,
  ...props
}: TextareaFieldProps) {
  return (
    <Field
      label={label}
      errors={errors}
      hint={hint}
      required={required}
      variant="textarea"
      className={fieldClassName}
    >
      {(fieldProps) => <Textarea {...fieldProps} required={required} {...props} />}
    </Field>
  );
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">,
    CommonFieldProps {
  children: ReactNode;
}

export function SelectField({
  label,
  errors,
  hint,
  fieldClassName,
  required,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <Field
      label={label}
      errors={errors}
      hint={hint}
      required={required}
      variant="select"
      className={fieldClassName}
      adornment={
        <IconChevronDown className="pointer-events-none mr-1.5 h-4 w-4 text-slate-400" />
      }
    >
      {(fieldProps) => (
        <Select {...fieldProps} required={required} {...props}>
          {children}
        </Select>
      )}
    </Field>
  );
}
