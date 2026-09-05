import type {
  DeliveryNoteStatus,
  DiscrepancySeverity,
  DiscrepancyType,
  InvoiceStatus,
  MatchStatus,
  MatchTrigger,
  PaymentAuthorizationStatus,
  PurchaseOrderStatus,
  ReviewStatus,
} from "@/types/api";
import type { Tone } from "@/components/ui/Badge";

/**
 * Traduction des statuts en libellé et en couleur.
 *
 * L'API renvoie déjà un `status_label`, utilisé partout où il est disponible.
 * Ces tables couvrent le reste : la **tonalité** (une couleur porteuse de sens
 * — rouge pour ce qui bloque un paiement, ambre pour ce qui attend un humain)
 * et les cas où seule la valeur brute est disponible.
 *
 * Les `Record` sont exhaustifs par type : ajouter une valeur d'enum côté PHP
 * sans l'ajouter ici fait échouer la compilation, plutôt que d'afficher une
 * case vide en production.
 */

export const PURCHASE_ORDER_STATUS_TONE: Record<PurchaseOrderStatus, Tone> = {
  draft: "neutral",
  open: "info",
  partially_received: "info",
  fully_received: "success",
  closed: "neutral",
  cancelled: "danger",
};

export const DELIVERY_NOTE_STATUS_TONE: Record<DeliveryNoteStatus, Tone> = {
  // Un BL en brouillon n'ouvre aucun droit : la couleur d'attente le rappelle.
  draft: "warning",
  accepted: "success",
  rejected: "danger",
};

export const DELIVERY_NOTE_STATUS_LABEL: Record<DeliveryNoteStatus, string> = {
  draft: "Brouillon",
  accepted: "Accepté",
  rejected: "Refusé",
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, Tone> = {
  received: "neutral",
  under_review: "warning",
  partially_approved: "info",
  approved: "success",
  disputed: "danger",
  cancelled: "neutral",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  received: "Reçue",
  under_review: "En revue",
  partially_approved: "Partiellement approuvée",
  approved: "Approuvée",
  disputed: "Litigieuse",
  cancelled: "Annulée",
};

export const MATCH_STATUS_TONE: Record<MatchStatus, Tone> = {
  matched: "success",
  partially_matched: "info",
  unmatched: "neutral",
  exception: "warning",
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  matched: "Rapproché",
  partially_matched: "Partiellement rapproché",
  unmatched: "Non rapproché",
  exception: "Écart à arbitrer",
};

export const DISCREPANCY_TYPE_LABEL: Record<DiscrepancyType, string> = {
  price_variance: "Écart de prix",
  quantity_over_ordered: "Quantité facturée supérieure au bon de commande",
  quantity_over_delivered: "Quantité livrée supérieure au bon de commande",
  missing_purchase_order_line: "Ligne de bon de commande absente",
  supplier_mismatch: "Fournisseur non concordant",
  missing_exchange_rate: "Taux de change indisponible",
  purchase_order_not_open: "Bon de commande non ouvert",
};

export const SEVERITY_TONE: Record<DiscrepancySeverity, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export const SEVERITY_LABEL: Record<DiscrepancySeverity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

export const REVIEW_STATUS_TONE: Record<ReviewStatus, Tone> = {
  open: "warning",
  approved: "success",
  rejected: "danger",
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  open: "À arbitrer",
  approved: "Accepté",
  rejected: "Refusé",
};

export const PAYMENT_STATUS_TONE: Record<PaymentAuthorizationStatus, Tone> = {
  active: "success",
  superseded: "neutral",
  revoked: "danger",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentAuthorizationStatus, string> = {
  active: "Active",
  superseded: "Remplacée",
  revoked: "Révoquée",
};

/** D'où vient un rapprochement — utile pour lire une piste d'audit. */
export const MATCH_TRIGGER_LABEL: Record<MatchTrigger, string> = {
  invoice_submitted: "Soumission de la facture",
  manual: "Relance manuelle",
  delivery_accepted: "Acceptation d'une livraison",
  exception_reviewed: "Arbitrage d'un écart",
  currency_changed: "Changement de devise de règlement",
};

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  buyer: "Acheteur",
  warehouse: "Magasinier",
  accountant: "Comptable fournisseurs",
  controller: "Contrôleur financier",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
