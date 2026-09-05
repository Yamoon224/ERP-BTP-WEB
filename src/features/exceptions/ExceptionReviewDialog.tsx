"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Modal, TextareaField } from "@/components/ui";
import { IconCheck, IconClose, IconException } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { DISCREPANCY_TYPE_LABEL, SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/domain-labels";
import { matchingService } from "@/services";
import type { MatchException } from "@/types/api";

type Decision = "approved" | "rejected";

/**
 * Arbitrage d'un écart.
 *
 * Le dialogue énonce explicitement la conséquence de chaque décision avant
 * qu'elle soit prise : accepter relance le moteur (qui seul recalcule le
 * montant payable), refuser met la facture en litige et révoque l'autorisation
 * en cours. Sur un geste qui débloque de l'argent, la conséquence ne doit pas
 * être une surprise.
 */
export function ExceptionReviewDialog({
  exception,
  isOpen,
  onClose,
  onReviewed,
}: {
  exception: MatchException | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [decision, setDecision] = useState<Decision>("approved");
  const [note, setNote] = useState("");

  const action = useCallback(
    (input: { id: number; decision: Decision; note: string }) =>
      matchingService.reviewException(input.id, input.decision, input.note),
    [],
  );

  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  function handleClose() {
    reset();
    setNote("");
    setDecision("approved");
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!exception) return;

    const result = await run({ id: exception.id, decision, note });
    if (result) {
      onReviewed();
      handleClose();
    }
  }

  if (!exception) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Arbitrer l'écart"
      description={exception.message}
    >
      <form id="review-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERITY_TONE[exception.severity]}>{SEVERITY_LABEL[exception.severity]}</Badge>
          <Badge tone="neutral">
            {exception.type_label ?? DISCREPANCY_TYPE_LABEL[exception.type]}
          </Badge>
          {!exception.is_overridable ? (
            <Badge tone="danger">Non dérogeable</Badge>
          ) : null}
        </div>

        {!exception.is_overridable ? (
          <p className="flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
            <IconException className="mt-0.5 h-4 w-4 shrink-0" />
            Cet écart ne peut pas être levé par un arbitrage favorable : la facture doit être
            corrigée à la source. Un accord sera enregistré, mais ne débloquera aucun paiement.
          </p>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Décision
          </legend>

          <DecisionOption
            value="approved"
            current={decision}
            onSelect={setDecision}
            title="Accepter l'écart"
            consequence="Le rapprochement est rejoué ; le moteur recalcule le montant payable et la décision porte votre nom."
          />
          <DecisionOption
            value="rejected"
            current={decision}
            onSelect={setDecision}
            title="Refuser l'écart"
            consequence="La facture passe en litige et l'autorisation de paiement en cours est révoquée. Décision terminale."
          />
        </fieldset>

        <TextareaField
          label="Motif"
          required
          rows={3}
          minLength={3}
          placeholder="Ex. : hausse contractuelle validée par le service achats le 12/03."
          errors={fieldErrors.note}
          hint="Obligatoire : c'est ce motif qui rendra la décision compréhensible lors d'un audit."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {error && Object.keys(fieldErrors).length === 0 ? (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {errorMessage(error, "L'arbitrage a échoué.")}
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
          Annuler
        </Button>
        <Button
          type="submit"
          form="review-form"
          variant={decision === "rejected" ? "danger" : "primary"}
          isLoading={isPending}
          icon={
            decision === "rejected" ? (
              <IconClose className="h-4 w-4" />
            ) : (
              <IconCheck className="h-4 w-4" />
            )
          }
        >
          {decision === "rejected" ? "Refuser" : "Accepter"}
        </Button>
      </div>
    </Modal>
  );
}

function DecisionOption({
  value,
  current,
  onSelect,
  title,
  consequence,
}: {
  value: Decision;
  current: Decision;
  onSelect: (decision: Decision) => void;
  title: string;
  consequence: string;
}) {
  const isSelected = current === value;

  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-sm border p-3 transition-colors",
        isSelected
          ? "grad-brand-soft border-blue-500 dark:border-blue-500"
          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
      )}
    >
      <input
        type="radio"
        name="decision"
        value={value}
        checked={isSelected}
        onChange={() => onSelect(value)}
        className="mt-1 accent-blue-600"
      />
      <span>
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">{consequence}</span>
      </span>
    </label>
  );
}
