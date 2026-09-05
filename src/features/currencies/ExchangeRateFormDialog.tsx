"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button, FormAlert, Modal, SelectField, TextField } from "@/components/ui";
import { IconCheck } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { CURRENCIES, CURRENCY_LABEL } from "@/lib/currency";
import { currencyService } from "@/services";
import type { EditableRateSource, ExchangeRateInput } from "@/services/currency-service";
import type { Currency, ExchangeRateQuote } from "@/types/api";

const today = () => new Date().toISOString().slice(0, 10);

/** La parite fixe n'apparait pas : elle est reglementaire, pas saisissable. */
const SOURCE_OPTIONS: Array<{ value: EditableRateSource; label: string }> = [
  { value: "manual", label: "Saisie manuelle" },
  { value: "provider", label: "Fournisseur de cotations" },
];

/**
 * Saisie ou correction d'une cotation.
 *
 * En creation, la paire est libre. En modification, elle est verrouillee :
 * changer la devise d'une ligne existante reecrirait l'historique d'une AUTRE
 * paire, et les rapprochements deja archives qui s'y referent deviendraient
 * inexplicables.
 */
export function ExchangeRateFormDialog({
  rate,
  isOpen,
  onClose,
  onSaved,
}: {
  /** `null` en creation. */
  rate: ExchangeRateQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = rate !== null;

  const [baseCurrency, setBaseCurrency] = useState<Currency>(rate?.base_currency ?? "EUR");
  const [quoteCurrency, setQuoteCurrency] = useState<Currency>(rate?.quote_currency ?? "XOF");
  const [value, setValue] = useState(rate ? String(rate.rate) : "");
  const [source, setSource] = useState<EditableRateSource>(
    rate && rate.source !== "fixed_peg" ? rate.source : "manual",
  );
  const [effectiveFrom, setEffectiveFrom] = useState(rate?.effective_from ?? today());

  const action = useCallback(
    (input: ExchangeRateInput) =>
      isEditing
        ? currencyService.updateRate(rate.id, {
            rate: input.rate,
            source: input.source,
            effective_from: input.effective_from,
          })
        : currencyService.createRate(input),
    [isEditing, rate],
  );

  const { run, isPending, error, fieldErrors } = useMutation(action);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = await run({
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      rate: Number(value),
      source,
      effective_from: effectiveFrom,
    });

    if (result) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Corriger une cotation" : "Enregistrer un taux"}
      description={
        isEditing
          ? "La paire n'est pas modifiable : pour coter une autre paire, créez une ligne."
          : "Un taux vaut à partir de sa date d'effet. Publier le cours du jour se fait en ajoutant une ligne, jamais en modifiant la précédente."
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="exchange-rate-form"
            isLoading={isPending}
            icon={<IconCheck className="h-4 w-4" />}
          >
            {isEditing ? "Enregistrer" : "Enregistrer le taux"}
          </Button>
        </>
      }
    >
      <form id="exchange-rate-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Devise de base"
            required
            disabled={isEditing}
            value={baseCurrency}
            errors={fieldErrors.base_currency}
            onChange={(event) => setBaseCurrency(event.target.value as Currency)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_LABEL[code]}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Devise cotée"
            required
            disabled={isEditing}
            value={quoteCurrency}
            errors={fieldErrors.quote_currency}
            onChange={(event) => setQuoteCurrency(event.target.value as Currency)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_LABEL[code]}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Taux"
            required
            type="number"
            step="0.000001"
            min="0"
            placeholder="655.957"
            value={value}
            errors={fieldErrors.rate}
            hint={`1 ${baseCurrency} = ? ${quoteCurrency}`}
            onChange={(event) => setValue(event.target.value)}
          />

          <TextField
            label="Date d'effet"
            required
            type="date"
            placeholder="2026-09-05"
            value={effectiveFrom}
            errors={fieldErrors.effective_from}
            hint="Le rapprochement retient le taux en vigueur à la date de la facture."
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />

          <SelectField
            label="Source"
            required
            fieldClassName="sm:col-span-2"
            value={source}
            errors={fieldErrors.source}
            hint="La parité fixe réglementaire ne se saisit pas : elle n'est pas une cotation."
            onChange={(event) => setSource(event.target.value as EditableRateSource)}
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "L'enregistrement du taux a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
