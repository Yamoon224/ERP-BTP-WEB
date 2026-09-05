"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  FormAlert,
  LoadingState,
  Modal,
  ResourceSelect,
  TextField,
  TextareaField,
} from "@/components/ui";
import type { ResourceOption } from "@/components/ui";
import { IconDelivery } from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { formatQuantity } from "@/lib/format";
import { deliveryNoteService, purchaseOrderService } from "@/services";
import type { DeliveryNoteInput } from "@/services/delivery-note-service";
import type { PurchaseOrder, PurchaseOrderLine } from "@/types/api";

const today = () => new Date().toISOString().slice(0, 10);

/** Statuts d'un bon de commande qui acceptent encore des documents. */
const OPEN_STATUSES = ["open", "partially_received", "fully_received"];

/**
 * Saisie d'un bon de livraison.
 *
 * Les lignes ne se saisissent pas librement : elles sont celles du bon de
 * commande choisi, et seule la quantite recue est ouverte. Une reception qui
 * pourrait porter sur un article non commande ne serait pas une reception,
 * ce serait un trou dans le controle.
 *
 * Le bon est cree en brouillon : la saisie et le controle sont deux gestes
 * distincts, et c'est cette separation qui empeche une livraison fictive
 * saisie au vol de devenir immediatement payable.
 */
export function DeliveryNoteFormDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [reference, setReference] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState<ResourceOption | null>(null);
  const [receivedAt, setReceivedAt] = useState(today);
  const [notes, setNotes] = useState("");

  // Seules les quantites *corrigees* sont memorisees ; les autres se lisent sur
  // le bon de commande au moment de l'affichage. Rien n'est donc recopie dans
  // un etat local, et il n'y a rien a resynchroniser quand le bon change.
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const action = useCallback((input: DeliveryNoteInput) => deliveryNoteService.create(input), []);
  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  const loadPurchaseOrders = useCallback(async (search: string): Promise<ResourceOption[]> => {
    const page = await purchaseOrderService.list({ search, per_page: 20 });

    return page.data
      // Un PO clos ou annule n'accepte plus de document : le proposer ne
      // menerait qu'a un 409 que l'utilisateur ne peut pas corriger.
      .filter((order) => OPEN_STATUSES.includes(order.status))
      .map((order) => ({
        value: order.id,
        label: order.reference,
        hint: [order.supplier?.name, order.project?.name].filter(Boolean).join(" · "),
      }));
  }, []);

  const loadOrder = useCallback(
    (): Promise<PurchaseOrder | null> =>
      purchaseOrder === null
        ? Promise.resolve(null)
        : purchaseOrderService.find(purchaseOrder.value),
    [purchaseOrder],
  );

  const { data: order, isLoading: isLoadingLines, error: linesError } = useAsyncData(loadOrder);

  const orderLines: PurchaseOrderLine[] = purchaseOrder === null ? [] : (order?.lines ?? []);

  /** Quantite retenue : la saisie si elle existe, la quantite commandee sinon. */
  const quantityOf = (line: PurchaseOrderLine): string =>
    quantities[line.id] ?? String(line.quantity_ordered);

  function selectPurchaseOrder(option: ResourceOption | null) {
    setPurchaseOrder(option);
    // Les corrections portaient sur les lignes du bon precedent : elles
    // n'auraient aucun sens sur un autre.
    setQuantities({});
  }

  function handleClose() {
    setReference("");
    selectPurchaseOrder(null);
    setReceivedAt(today());
    setNotes("");
    reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!purchaseOrder) return;

    // Une ligne a zero n'est pas une ligne recue : on ne l'envoie pas, plutot
    // que d'archiver une reception de rien.
    const lines = orderLines
      .map((line) => ({
        purchase_order_line_id: line.id,
        quantity_received: Number(quantityOf(line)),
      }))
      .filter((line) => line.quantity_received > 0);

    const result = await run({
      reference,
      purchase_order_id: purchaseOrder.value,
      received_at: receivedAt,
      notes: notes.trim() === "" ? null : notes,
      lines,
    });

    if (result) {
      onCreated();
      handleClose();
    }
  }

  const hasLines = orderLines.some((line) => Number(quantityOf(line)) > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Saisir un bon de livraison"
      description="Ce qui est physiquement arrivé. La réception est enregistrée en brouillon : elle n'ouvrira un droit à paiement qu'une fois acceptée."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="delivery-note-form"
            isLoading={isPending}
            disabled={!hasLines}
            icon={<IconDelivery className="h-4 w-4" />}
          >
            Enregistrer la réception
          </Button>
        </>
      }
    >
      <form id="delivery-note-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Référence du bon de livraison"
            required
            placeholder="BL-2026-0042"
            value={reference}
            errors={fieldErrors.reference}
            onChange={(event) => setReference(event.target.value)}
          />

          <TextField
            label="Reçu le"
            required
            type="date"
            placeholder="2026-09-05"
            value={receivedAt}
            errors={fieldErrors.received_at}
            onChange={(event) => setReceivedAt(event.target.value)}
          />

          <ResourceSelect
            className="sm:col-span-2"
            label="Bon de commande"
            required
            placeholder="Rechercher une référence de commande…"
            selected={purchaseOrder}
            onChange={selectPurchaseOrder}
            loadOptions={loadPurchaseOrders}
            errors={fieldErrors.purchase_order_id}
            hint="Le fournisseur est repris du bon de commande : une livraison ne peut pas changer d'émetteur."
            emptyLabel="Aucun bon de commande ouvert ne correspond"
          />
        </div>

        {purchaseOrder && isLoadingLines ? (
          <LoadingState label="Chargement des lignes commandées…" />
        ) : null}

        {linesError ? (
          <FormAlert>
            {errorMessage(linesError, "Les lignes du bon de commande n'ont pas pu être chargées.")}
          </FormAlert>
        ) : null}

        {orderLines.length > 0 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Quantités reçues
            </legend>

            <div className="overflow-x-auto rounded-sm border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="grad-brand text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                      Commandé
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                      Reçu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderLines.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b border-slate-100 odd:bg-[var(--surface)] even:bg-slate-50/70 last:border-0 dark:border-slate-800/70 dark:even:bg-slate-800/40"
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {line.item_code}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {line.description}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatQuantity(line.quantity_ordered, line.unit)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          aria-label={`Quantité reçue pour ${line.item_code}`}
                          value={quantityOf(line)}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [line.id]: event.target.value,
                            }))
                          }
                          className="w-32 rounded-sm border-0 bg-[var(--surface)] px-2 py-1.5 text-right text-sm tabular-nums text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:text-slate-100 dark:ring-slate-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pré-remplies avec les quantités commandées. Une ligne laissée à zéro n&apos;est pas
              enregistrée.
            </p>
          </fieldset>
        ) : null}

        <TextareaField
          label="Observations"
          rows={2}
          placeholder="Ex. : palette 3 endommagée, refusée sur place."
          value={notes}
          errors={fieldErrors.notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "L'enregistrement de la réception a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
