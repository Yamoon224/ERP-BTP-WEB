"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  FormAlert,
  Modal,
  ResourceSelect,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/ui";
import type { ResourceOption } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { CURRENCY_LABEL, CURRENCIES } from "@/lib/currency";
import { purchaseOrderService, referenceService } from "@/services";
import type { PurchaseOrderInput } from "@/services/purchase-order-service";

interface LineDraft {
  /** Cle locale : les lignes n'ont pas d'identifiant avant d'exister en base. */
  key: number;
  item_code: string;
  description: string;
  unit: string;
  quantity_ordered: string;
  unit_price: string;
}

function emptyLine(key: number): LineDraft {
  return { key, item_code: "", description: "", unit: "u", quantity_ordered: "", unit_price: "" };
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Saisie d'un bon de commande.
 *
 * C'est le document qui fixe la reference du controle : ce qui est autorise a
 * l'achat, en quantite comme en prix. Tout ce qui sera compare ensuite — la
 * livraison, la facture — se mesure a ces lignes, d'ou l'insistance du
 * formulaire a en faire saisir au moins une.
 */
export function PurchaseOrderFormDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [reference, setReference] = useState("");
  const [supplier, setSupplier] = useState<ResourceOption | null>(null);
  const [project, setProject] = useState<ResourceOption | null>(null);
  const [currency, setCurrency] = useState("EUR");
  const [orderedAt, setOrderedAt] = useState(today);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(0)]);
  const [nextKey, setNextKey] = useState(1);

  const action = useCallback((input: PurchaseOrderInput) => purchaseOrderService.create(input), []);
  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  const loadSuppliers = useCallback(
    async (search: string): Promise<ResourceOption[]> => {
      const page = await referenceService.listSuppliers({ search, is_active: true, per_page: 20 });

      return page.data.map((item) => ({ value: item.id, label: item.name, hint: item.code }));
    },
    [],
  );

  const loadProjects = useCallback(async (search: string): Promise<ResourceOption[]> => {
    const page = await referenceService.listProjects({ search, is_active: true, per_page: 20 });

    return page.data.map((item) => ({
      value: item.id,
      label: item.name,
      hint: [item.code, item.client_name].filter(Boolean).join(" · "),
    }));
  }, []);

  function resetForm() {
    setReference("");
    setSupplier(null);
    setProject(null);
    setCurrency("EUR");
    setOrderedAt(today());
    setNotes("");
    setLines([emptyLine(0)]);
    setNextKey(1);
    reset();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function updateLine(key: number, patch: Partial<LineDraft>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supplier || !project) return;

    const result = await run({
      reference,
      supplier_id: supplier.value,
      project_id: project.value,
      currency,
      ordered_at: orderedAt,
      notes: notes.trim() === "" ? null : notes,
      lines: lines.map((line) => ({
        item_code: line.item_code,
        description: line.description,
        unit: line.unit,
        quantity_ordered: Number(line.quantity_ordered),
        unit_price: Number(line.unit_price),
      })),
    });

    if (result) {
      onCreated();
      handleClose();
    }
  }

  // Le total n'est pas envoye au backend — il le recalcule — mais il est
  // affiche : personne ne devrait valider un engagement sans en voir le montant.
  const total = lines.reduce(
    (sum, line) => sum + (Number(line.quantity_ordered) || 0) * (Number(line.unit_price) || 0),
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Créer un bon de commande"
      description="Ce que vous engagez auprès du fournisseur. Les quantités et les prix saisis ici deviennent la référence du rapprochement."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="purchase-order-form"
            isLoading={isPending}
            icon={<IconPlus className="h-4 w-4" />}
          >
            Créer le bon de commande
          </Button>
        </>
      }
    >
      <form id="purchase-order-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Référence"
            required
            placeholder="PO-2026-0042"
            value={reference}
            errors={fieldErrors.reference}
            onChange={(event) => setReference(event.target.value)}
          />

          <TextField
            label="Date de commande"
            required
            type="date"
            placeholder="2026-09-05"
            value={orderedAt}
            errors={fieldErrors.ordered_at}
            onChange={(event) => setOrderedAt(event.target.value)}
          />

          <ResourceSelect
            label="Fournisseur"
            required
            placeholder="Rechercher un fournisseur…"
            selected={supplier}
            onChange={setSupplier}
            loadOptions={loadSuppliers}
            errors={fieldErrors.supplier_id}
          />

          <ResourceSelect
            label="Chantier"
            required
            placeholder="Rechercher un chantier…"
            selected={project}
            onChange={setProject}
            loadOptions={loadProjects}
            errors={fieldErrors.project_id}
          />

          <SelectField
            label="Devise"
            value={currency}
            errors={fieldErrors.currency}
            hint="La facture pourra être libellée dans une autre devise ; le moteur convertira."
            onChange={(event) => setCurrency(event.target.value)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_LABEL[code]}
              </option>
            ))}
          </SelectField>

          <TextareaField
            fieldClassName="sm:col-span-2"
            label="Notes"
            rows={2}
            placeholder="Ex. : livraison sur site, accès poids lourds par le portail nord."
            value={notes}
            errors={fieldErrors.notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Lignes commandées
          </legend>

          {lines.map((line, index) => (
            <div
              key={line.key}
              className="grid grid-cols-1 gap-3 rounded-sm border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-800"
            >
              <TextField
                label="Article"
                required
                placeholder="CIM-42"
                fieldClassName="sm:col-span-2"
                value={line.item_code}
                errors={fieldErrors[`lines.${index}.item_code`]}
                onChange={(event) => updateLine(line.key, { item_code: event.target.value })}
              />
              <TextField
                label="Désignation"
                required
                placeholder="Ciment CEM II 42,5 — sac 35 kg"
                fieldClassName="sm:col-span-4"
                value={line.description}
                errors={fieldErrors[`lines.${index}.description`]}
                onChange={(event) => updateLine(line.key, { description: event.target.value })}
              />
              <TextField
                label="Unité"
                required
                placeholder="sac"
                fieldClassName="sm:col-span-1"
                value={line.unit}
                errors={fieldErrors[`lines.${index}.unit`]}
                onChange={(event) => updateLine(line.key, { unit: event.target.value })}
              />
              <TextField
                label="Quantité"
                required
                type="number"
                min="0"
                step="0.001"
                placeholder="400"
                fieldClassName="sm:col-span-2"
                value={line.quantity_ordered}
                errors={fieldErrors[`lines.${index}.quantity_ordered`]}
                onChange={(event) =>
                  updateLine(line.key, { quantity_ordered: event.target.value })
                }
              />
              <TextField
                label="Prix unitaire"
                required
                type="number"
                min="0"
                step="0.0001"
                placeholder="8.90"
                fieldClassName="sm:col-span-2"
                value={line.unit_price}
                errors={fieldErrors[`lines.${index}.unit_price`]}
                onChange={(event) => updateLine(line.key, { unit_price: event.target.value })}
              />

              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer la ligne ${index + 1}`}
                  // Un bon de commande sans ligne n'engage rien : la derniere
                  // ligne ne peut pas etre retiree.
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((current) => current.filter((item) => item.key !== line.key))
                  }
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<IconPlus className="h-3.5 w-3.5" />}
              onClick={() => {
                setLines((current) => [...current, emptyLine(nextKey)]);
                setNextKey((key) => key + 1);
              }}
            >
              Ajouter une ligne
            </Button>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Total engagé :{" "}
              <strong className="tabular-nums text-slate-900 dark:text-slate-100">
                {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {currency}
              </strong>
            </p>
          </div>
        </fieldset>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "La création du bon de commande a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
