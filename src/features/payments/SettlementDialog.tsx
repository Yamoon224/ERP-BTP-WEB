"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Badge, Button, DescriptionList, FormAlert, Modal, SelectField, TextField } from "@/components/ui";
import { IconBanknote } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/format";
import { paymentService } from "@/services";
import type { PaymentAuthorization, PaymentMethod } from "@/types/api";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  transfer: "Virement",
  check: "Chèque",
  card: "Carte",
  cash: "Espèces",
  direct_debit: "Prélèvement",
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Reglement d'une facture autorisee.
 *
 * Le montant est affiche mais **non saisissable** : c'est celui qu'a calcule le
 * moteur. Ouvrir ce champ reviendrait a permettre de payer ce que le
 * rapprochement a bloque, et viderait de son sens tout le controle a 3 voies —
 * le backend le refuse d'ailleurs.
 *
 * La reference bancaire est en revanche obligatoire : sans elle, personne ne
 * pourra relier cette ligne au virement correspondant sur un releve.
 */
export function SettlementDialog({
  authorization,
  isOpen,
  onClose,
  onSettled,
}: {
  authorization: PaymentAuthorization | null;
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
}) {
  const [paymentReference, setPaymentReference] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [settledAt, setSettledAt] = useState(today);

  const action = useCallback(
    (input: { id: number; payment_reference: string; payment_method: PaymentMethod; settled_at: string }) =>
      paymentService.settle(input.id, {
        payment_reference: input.payment_reference,
        payment_method: input.payment_method,
        settled_at: input.settled_at,
      }),
    [],
  );

  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  function handleClose() {
    setPaymentReference("");
    setMethod("transfer");
    setSettledAt(today());
    reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!authorization) return;

    const result = await run({
      id: authorization.id,
      payment_reference: paymentReference,
      payment_method: method,
      settled_at: settledAt,
    });

    if (result) {
      onSettled();
      handleClose();
    }
  }

  if (!authorization) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Régler la facture"
      description="Vous constatez un paiement déjà autorisé par le rapprochement. Le montant n'est pas modifiable ici."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="settlement-form"
            isLoading={isPending}
            icon={<IconBanknote className="h-4 w-4" />}
          >
            Enregistrer le règlement
          </Button>
        </>
      }
    >
      <form id="settlement-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-sm border border-slate-200 px-4 py-3 dark:border-slate-800">
          <DescriptionList
            items={[
              {
                label: "Facture",
                value: authorization.invoice?.reference ?? `#${authorization.invoice_id}`,
              },
              { label: "Fournisseur", value: authorization.invoice?.supplier?.name ?? "—" },
              {
                label: "Montant autorisé",
                value: (
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="tabular-nums">
                      {formatMoney(authorization.amount, authorization.currency)}
                    </strong>
                    <Badge tone="success">Issu de l&apos;exécution n°{authorization.match_run_id}</Badge>
                  </span>
                ),
              },
              {
                label: "Autorisée le",
                value: formatDateTime(authorization.authorized_at),
              },
            ]}
          />
        </div>

        <TextField
          label="Référence du règlement"
          required
          minLength={3}
          placeholder="VIR-2026-00042"
          value={paymentReference}
          errors={fieldErrors.payment_reference}
          hint="Obligatoire : c'est elle qui permettra de retrouver ce paiement sur le relevé bancaire."
          onChange={(event) => setPaymentReference(event.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Moyen de paiement"
            value={method}
            errors={fieldErrors.payment_method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((value) => (
              <option key={value} value={value}>
                {METHOD_LABEL[value]}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Date de valeur"
            type="date"
            max={today()}
            placeholder="2026-09-05"
            value={settledAt}
            errors={fieldErrors.settled_at}
            onChange={(event) => setSettledAt(event.target.value)}
          />
        </div>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "L'enregistrement du règlement a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}

export { METHOD_LABEL as PAYMENT_METHOD_LABEL };
