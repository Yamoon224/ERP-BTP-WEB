"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  FormAlert,
  LoadingState,
  Modal,
  ResourceSelect,
  SelectField,
  TextField,
} from "@/components/ui";
import type { ResourceOption } from "@/components/ui";
import { IconBilling } from "@/components/ui/icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useMutation } from "@/hooks/useMutation";
import { errorMessage } from "@/lib/api-client";
import { config } from "@/lib/config";
import { CURRENCIES, CURRENCY_LABEL } from "@/lib/currency";
import { formatMoney, formatQuantity } from "@/lib/format";
import { invoiceService, purchaseOrderService, referenceService } from "@/services";
import type { InvoiceInput } from "@/services/invoice-service";
import type { PurchaseOrder, PurchaseOrderLine } from "@/types/api";

const today = () => new Date().toISOString().slice(0, 10);
const inThirtyDays = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

/** Statuts d'un bon de commande qui acceptent encore des documents. */
const OPEN_STATUSES = ["open", "partially_received", "fully_received"];

/**
 * Saisie d'une facture fournisseur.
 *
 * Soumettre une facture **declenche immediatement son rapprochement** : le
 * controle a 3 voies est la porte d'entree du circuit de paiement, pas une
 * etape qu'on penserait a lancer plus tard. Le formulaire l'annonce, parce que
 * la facture peut ressortir en litige dans la seconde qui suit.
 *
 * Le fournisseur se choisit, mais il n'est **pas** envoye : il ne sert qu'a
 * reduire la liste des bons de commande. Celui que retiendra la facture est
 * toujours celui du bon — c'est ce qui garantit que la comparaison porte sur
 * une donnee que l'emetteur de la facture ne choisit pas. Le total, lui, est
 * recalcule depuis les lignes.
 */
export function InvoiceFormDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [reference, setReference] = useState("");
  // Le fournisseur ne part pas dans la requete : le backend le derive du bon
  // de commande, precisement pour que l'emetteur de la facture ne puisse pas
  // le choisir. Ici, il ne sert qu'a reduire la liste des commandes — ce qui,
  // sur cent cinquante bons ouverts, est la difference entre chercher et
  // trouver.
  const [supplier, setSupplier] = useState<ResourceOption | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<ResourceOption | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState(inThirtyDays);

  // Comme pour la reception : seules les valeurs *corrigees* sont memorisees.
  // Le reste se lit sur le bon de commande a l'affichage, ce qui evite d'avoir
  // a resynchroniser un etat local quand le bon change.
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, true>>({});
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);

  const action = useCallback((input: InvoiceInput) => invoiceService.submit(input), []);
  const { run, isPending, error, fieldErrors, reset } = useMutation(action);

  const loadSuppliers = useCallback(async (search: string): Promise<ResourceOption[]> => {
    const page = await referenceService.listSuppliers({ search, per_page: 20, is_active: true });

    return page.data.map((item) => ({
      value: item.id,
      label: item.name,
      hint: item.code,
    }));
  }, []);

  const loadPurchaseOrders = useCallback(
    async (search: string): Promise<ResourceOption[]> => {
      const page = await purchaseOrderService.list({
        search,
        per_page: 20,
        supplier_id: supplier?.value,
      });

      return page.data
        .filter((order) => OPEN_STATUSES.includes(order.status))
        .map((order) => ({
          value: order.id,
          label: order.reference,
          hint: [order.supplier?.name, order.project?.name].filter(Boolean).join(" · "),
        }));
    },
    [supplier],
  );

  const loadOrder = useCallback(
    (): Promise<PurchaseOrder | null> =>
      purchaseOrder === null
        ? Promise.resolve(null)
        : purchaseOrderService.find(purchaseOrder.value),
    [purchaseOrder],
  );

  const { data: order, isLoading: isLoadingLines, error: linesError } = useAsyncData(loadOrder);

  const orderLines: PurchaseOrderLine[] = purchaseOrder === null ? [] : (order?.lines ?? []);

  // La facture nait dans la devise de reglement de l'entreprise, et non dans
  // celle du bon de commande : c'est en francs CFA que le virement partira. Un
  // contrat en euros reste possible — le moteur convertit alors pour comparer
  // les prix — mais il ne dicte pas la devise de la creance.
  const currency = currencyOverride ?? config.defaultCurrency;

  const quantityOf = (line: PurchaseOrderLine) =>
    quantities[line.id] ?? String(line.quantity_ordered);
  const priceOf = (line: PurchaseOrderLine) => prices[line.id] ?? String(line.unit_price);
  const isIncluded = (line: PurchaseOrderLine) => excluded[line.id] !== true;

  function selectPurchaseOrder(option: ResourceOption | null) {
    setPurchaseOrder(option);
    setQuantities({});
    setPrices({});
    setExcluded({});
    setCurrencyOverride(null);
  }

  // Changer de fournisseur invalide le bon de commande deja choisi : le
  // conserver ferait saisir une facture rattachee a un autre fournisseur que
  // celui affiche, ce que le backend refuserait a la soumission.
  function selectSupplier(option: ResourceOption | null) {
    setSupplier(option);
    selectPurchaseOrder(null);
  }

  function toggleLine(line: PurchaseOrderLine, include: boolean) {
    setExcluded((current) => {
      const next = { ...current };
      if (include) delete next[line.id];
      else next[line.id] = true;

      return next;
    });
  }

  function handleClose() {
    setReference("");
    selectSupplier(null);
    setInvoiceDate(today());
    setDueDate(inThirtyDays());
    reset();
    onClose();
  }

  const selectedLines = orderLines.filter(isIncluded);

  const total = selectedLines.reduce(
    (sum, line) => sum + (Number(quantityOf(line)) || 0) * (Number(priceOf(line)) || 0),
    0,
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!purchaseOrder) return;

    const result = await run({
      reference,
      purchase_order_id: purchaseOrder.value,
      currency,
      invoice_date: invoiceDate,
      due_date: dueDate === "" ? null : dueDate,
      lines: selectedLines.map((line) => ({
        purchase_order_line_id: line.id,
        description: line.description,
        quantity: Number(quantityOf(line)),
        unit_price: Number(priceOf(line)),
      })),
    });

    if (result) {
      onCreated();
      handleClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Saisir une facture"
      description="La facture est rapprochée dès sa soumission : le résultat du contrôle sera disponible immédiatement."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="invoice-form"
            isLoading={isPending}
            disabled={selectedLines.length === 0}
            icon={<IconBilling className="h-4 w-4" />}
          >
            Soumettre et rapprocher
          </Button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/*
          Grille a deux colonnes, chaque champ occupant une cellule entiere et
          alignant sa ligne de saisie sur celle de sa voisine. Les deux
          selecteurs de ressource portent desormais la meme coquille que les
          champs texte (libelle flottant, meme hauteur) : c'est ce qui empeche
          les lignes de se decaler des qu'un champ porte une aide et pas
          l'autre. L'ecart vertical est plus large que l'horizontal, pour que
          l'aide d'un champ ne se lise pas comme celle du suivant.
        */}
        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 sm:grid-cols-2">
          <TextField
            label="Référence fournisseur"
            required
            placeholder="FAC-2026-0042"
            value={reference}
            errors={fieldErrors.reference}
            onChange={(event) => setReference(event.target.value)}
          />

          <ResourceSelect
            label="Fournisseur"
            required
            placeholder="Rechercher un fournisseur…"
            selected={supplier}
            onChange={selectSupplier}
            loadOptions={loadSuppliers}
            hint="Réduit la liste des bons de commande. Le fournisseur retenu reste celui du bon."
            emptyLabel="Aucun fournisseur actif ne correspond"
          />

          {/* Pleine largeur : c'est le champ qui commande tout le reste du
              formulaire, et ses references sont longues. */}
          <ResourceSelect
            className="sm:col-span-2"
            label="Bon de commande"
            required
            placeholder="Rechercher une référence de commande…"
            selected={purchaseOrder}
            onChange={selectPurchaseOrder}
            loadOptions={loadPurchaseOrders}
            errors={fieldErrors.purchase_order_id}
            emptyLabel={
              supplier === null
                ? "Aucun bon de commande ouvert ne correspond"
                : `Aucun bon de commande ouvert pour ${supplier.label}`
            }
          />

          <TextField
            label="Date de facture"
            required
            type="date"
            placeholder="2026-09-05"
            value={invoiceDate}
            errors={fieldErrors.invoice_date}
            onChange={(event) => setInvoiceDate(event.target.value)}
          />

          <TextField
            label="Échéance"
            type="date"
            placeholder="2026-10-05"
            value={dueDate}
            errors={fieldErrors.due_date}
            onChange={(event) => setDueDate(event.target.value)}
          />

          <SelectField
            fieldClassName="sm:col-span-2"
            label="Devise de facturation"
            value={currency}
            errors={fieldErrors.currency}
            hint="Devise du règlement. Si elle diffère de celle du bon de commande, le moteur convertit au taux en vigueur à la date de la facture."
            onChange={(event) => setCurrencyOverride(event.target.value)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_LABEL[code]}
              </option>
            ))}
          </SelectField>
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
              Lignes facturées
            </legend>

            <div className="overflow-x-auto rounded-sm border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="grad-brand text-white">
                  <tr>
                    <th className="w-10 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                      <span className="sr-only">Inclure</span>
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                      Commandé
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                      Prix unitaire
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderLines.map((line) => {
                    const included = isIncluded(line);

                    return (
                      <tr
                        key={line.id}
                        className="border-b border-slate-100 odd:bg-[var(--surface)] even:bg-slate-50/70 last:border-0 dark:border-slate-800/70 dark:even:bg-slate-800/40"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Facturer la ligne ${line.item_code}`}
                            checked={included}
                            onChange={(event) => toggleLine(line, event.target.checked)}
                            className="accent-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {line.item_code}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {line.description}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          {formatQuantity(line.quantity_ordered, line.unit)}
                          <br />à {line.unit_price}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            disabled={!included}
                            aria-label={`Quantité facturée pour ${line.item_code}`}
                            value={quantityOf(line)}
                            onChange={(event) =>
                              setQuantities((current) => ({
                                ...current,
                                [line.id]: event.target.value,
                              }))
                            }
                            className="w-28 rounded-sm border-0 bg-[var(--surface)] px-2 py-1.5 text-right text-sm tabular-nums text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:opacity-50 dark:text-slate-100 dark:ring-slate-600"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            disabled={!included}
                            aria-label={`Prix unitaire facturé pour ${line.item_code}`}
                            value={priceOf(line)}
                            onChange={(event) =>
                              setPrices((current) => ({
                                ...current,
                                [line.id]: event.target.value,
                              }))
                            }
                            className="w-32 rounded-sm border-0 bg-[var(--surface)] px-2 py-1.5 text-right text-sm tabular-nums text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:opacity-50 dark:text-slate-100 dark:ring-slate-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                Pré-remplies au bon de commande. Tout écart de prix ou de quantité sera signalé
                pour arbitrage, jamais accepté en silence.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Total facturé :{" "}
                <strong className="tabular-nums text-slate-900 dark:text-slate-100">
                  {formatMoney(total, currency)}
                </strong>
              </p>
            </div>
          </fieldset>
        ) : null}

        {error && Object.keys(fieldErrors).length === 0 ? (
          <FormAlert>{errorMessage(error, "La soumission de la facture a échoué.")}</FormAlert>
        ) : null}
      </form>
    </Modal>
  );
}
