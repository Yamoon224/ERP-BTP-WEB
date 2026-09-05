"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button, FormAlert, Modal, SelectField } from "@/components/ui";
import { IconRefresh } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { CURRENCIES, CURRENCY_LABEL } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import { invoiceService } from "@/services";
import type { Currency, Invoice } from "@/types/api";

/**
 * Changement de la devise de reglement d'une facture.
 *
 * Ce n'est pas un reglage d'affichage. La devise est l'unite dans laquelle le
 * prix facture sera confronte au prix commande, donc celle du montant autorise
 * au paiement : la changer **rejoue le rapprochement**, et le verdict peut
 * basculer. Le dialogue le dit avant de valider, pas apres.
 *
 * Les montants des lignes ne sont pas convertis : corriger la devise corrige
 * la facon dont la facture a ete lue, pas ce que le fournisseur a ecrit
 * dessus.
 */
export function InvoiceCurrencyDialog({
  invoice,
  isOpen,
  onClose,
  onChanged,
}: {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [currency, setCurrency] = useState<Currency>(invoice.currency);

  const action = useCallback(
    (next: Currency) => invoiceService.changeCurrency(invoice.id, next),
    [invoice.id],
  );
  const { run, isPending, error, fieldErrors } = useMutation(action);

  const hasChanged = currency !== invoice.currency;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (await run(currency)) {
      onChanged();
      onClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Changer la devise de règlement"
      description={`Facture ${invoice.reference} — actuellement en ${invoice.currency}.`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="invoice-currency-form"
            isLoading={isPending}
            disabled={!hasChanged}
            icon={<IconRefresh className="h-4 w-4" />}
          >
            Changer et rapprocher
          </Button>
        </>
      }
    >
      <form id="invoice-currency-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SelectField
          label="Devise de règlement"
          required
          value={currency}
          errors={fieldErrors.currency}
          onChange={(event) => setCurrency(event.target.value as Currency)}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code} — {CURRENCY_LABEL[code]}
            </option>
          ))}
        </SelectField>

        <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/50">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Le rapprochement sera rejoué immédiatement.
          </p>
          <p className="mt-1 text-amber-800 dark:text-amber-300">
            Les montants des lignes ne changent pas : seule l&apos;unité dans laquelle ils sont lus
            change. Le total de {formatMoney(invoice.total_amount, invoice.currency)} deviendra{" "}
            {formatMoney(invoice.total_amount, currency)}, et le montant autorisé au paiement sera
            recalculé — il peut augmenter, diminuer, ou tomber à zéro.
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            L&apos;exécution précédente reste archivée : cette correction en crée une nouvelle,
            elle n&apos;en efface aucune.
          </p>
        </div>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "Le changement de devise a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
