/**
 * Types du contrat d'API, alignés sur `backend/resources/openapi/openapi.yaml`.
 *
 * Ils sont écrits à la main plutôt que générés : le frontend ne consomme qu'une
 * partie du contrat, et une génération complète produirait des centaines de
 * types dont la moitié ne servirait jamais. En contrepartie, les unions de
 * statuts ci-dessous reprennent exactement les enums PHP — toute divergence se
 * voit immédiatement à la compilation TypeScript.
 */

// --- Enveloppes ------------------------------------------------------------

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface Single<T> {
  data: T;
}

// --- Devises ---------------------------------------------------------------

// Re-exportee depuis lib/currency, ou vivent aussi le nombre de decimales et
// les libelles : une seule source de verite pour les devises.
import type { Currency } from "@/lib/currency";

export type { Currency };

export type ExchangeRateSource = "fixed_peg" | "manual" | "provider";

/** Taux appliqué lors d'une conversion, archivé avec la décision. */
export interface ExchangeRate {
  from: Currency;
  to: Currency;
  /** Multiplicateur : montant_en_`to` = montant_en_`from` × rate. */
  rate: number;
  source: ExchangeRateSource;
  effective_from: string | null;
}

/**
 * Taux appliqués par un rapprochement. Trois devises coexistent : celle de la
 * facture (le règlement), celle du bon de commande (la comparaison des prix) et
 * celle de référence (l'agrégation).
 */
export interface ExchangeRateSnapshot {
  invoice_currency: Currency;
  comparison_currency: Currency;
  base_currency: Currency;
  invoice_to_comparison?: ExchangeRate;
  invoice_to_base?: ExchangeRate;
  base_to_comparison?: ExchangeRate;
}

// --- Statuts ---------------------------------------------------------------

export type PurchaseOrderStatus =
  | "draft"
  | "open"
  | "partially_received"
  | "fully_received"
  | "closed"
  | "cancelled";

export type DeliveryNoteStatus = "draft" | "accepted" | "rejected";

export type InvoiceStatus =
  | "received"
  | "under_review"
  | "partially_approved"
  | "approved"
  | "disputed"
  | "cancelled";

export type MatchStatus = "matched" | "partially_matched" | "unmatched" | "exception";

export type DiscrepancyType =
  | "price_variance"
  | "quantity_over_ordered"
  | "quantity_over_delivered"
  | "missing_purchase_order_line"
  | "supplier_mismatch"
  | "missing_exchange_rate"
  | "purchase_order_not_open";

export type DiscrepancySeverity = "low" | "medium" | "high" | "critical";

export type ReviewStatus = "open" | "approved" | "rejected";

export type ActorType = "system" | "user";

export type PaymentAuthorizationStatus = "active" | "superseded" | "revoked";

// --- Référentiel -----------------------------------------------------------

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/** Vue administrateur d'un compte : la meme, plus sa date de creation. */
export interface AdminUser extends User {
  created_at: string | null;
}

/** Role assignable et ce qu'il autorise, pour l'ecran d'administration. */
export interface Role {
  name: string;
  permissions: string[];
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  vat_number: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  client_name: string | null;
  is_active: boolean;
  created_at: string | null;
}

// --- Achats ----------------------------------------------------------------

export interface PurchaseOrderLine {
  id: number;
  line_number: number;
  item_code: string;
  description: string;
  unit: string;
  quantity_ordered: number;
  unit_price: number;
  ordered_amount: number;
}

export interface PurchaseOrder {
  id: number;
  reference: string;
  status: PurchaseOrderStatus;
  status_label: string;
  currency: Currency;
  ordered_at: string;
  notes: string | null;
  supplier?: Supplier;
  project?: Project;
  lines?: PurchaseOrderLine[];
  total_amount?: number;
  lines_count?: number;
  delivery_notes_count?: number;
  invoices_count?: number;
  created_at: string | null;
}

// --- Réceptions ------------------------------------------------------------

export interface DeliveryNoteLine {
  id: number;
  purchase_order_line_id: number;
  quantity_received: number;
  purchase_order_line?: {
    id: number;
    line_number: number;
    item_code: string;
    description: string;
    unit: string;
    quantity_ordered: number;
  };
}

export interface DeliveryNote {
  id: number;
  reference: string;
  status: DeliveryNoteStatus;
  status_label: string;
  counts_as_received: boolean;
  received_at: string;
  notes: string | null;
  purchase_order_id: number;
  purchase_order?: { id: number; reference: string; status: PurchaseOrderStatus };
  supplier?: Supplier;
  lines?: DeliveryNoteLine[];
  lines_count?: number;
  created_at: string | null;
}

// --- Rapprochement ---------------------------------------------------------

/**
 * Preuve chiffrée archivée avec chaque ligne rapprochée. Les clés sont celles
 * produites par le moteur : elles répondent à « sur la base de quelles
 * données cette décision a-t-elle été prise ».
 */
export interface MatchEvidence {
  purchase_order_line_id?: number;
  purchase_order_line_number?: number;
  item_code?: string;
  quantity_ordered?: number;
  quantity_received?: number;
  quantity_already_matched?: number;
  quantity_available_for_matching?: number;
  quantity_remaining_on_order?: number;
  quantity_invoiced?: number;
  quantity_tolerance_threshold?: number;
  unit_price_ordered?: number;
  unit_price_invoiced?: number;
  price_delta?: number;
  price_tolerance_threshold?: number;
  price_within_tolerance?: boolean;
  price_override_approved?: boolean;
  /** Champs de conversion, présents dès que les devises diffèrent. */
  invoice_currency?: Currency;
  comparison_currency?: Currency;
  conversion_applied?: boolean;
  exchange_rate?: number | null;
  exchange_rate_source?: ExchangeRateSource | null;
  exchange_rate_effective_from?: string | null;
  unit_price_invoiced_in_comparison_currency?: number;
  approved_overrides?: string[];
  blocked_by_invoice_level_discrepancy?: boolean;
  discrepancy_types?: string[];
}

export interface MatchLineResult {
  id: number;
  invoice_line_id: number;
  purchase_order_line_id: number | null;
  status: MatchStatus;
  status_label: string;
  quantity_invoiced: number;
  quantity_matched: number;
  quantity_unmatched: number;
  unit_price_invoiced: number;
  unit_price_ordered: number | null;
  price_variance_ratio: number | null;
  matched_amount: number;
  evidence: MatchEvidence;
  invoice_line?: { id: number; line_number: number; description: string };
}

export interface ToleranceSnapshot {
  price_ratio: number;
  price_absolute: number;
  quantity_ratio: number;
  quantity_absolute: number;
  /** Devise dans laquelle le seuil absolu a réellement été appliqué. */
  currency: Currency;
}

export type MatchTrigger =
  | "invoice_submitted"
  | "manual"
  | "delivery_accepted"
  | "exception_reviewed";

export interface MatchRun {
  id: number;
  invoice_id: number;
  status: MatchStatus;
  status_label: string;
  decided_by: {
    actor_type: ActorType;
    actor_id: number | null;
    label: string;
  };
  trigger: MatchTrigger;
  engine_version: string;
  tolerance_snapshot: ToleranceSnapshot;
  exchange_rate_snapshot: ExchangeRateSnapshot | null;
  evaluated_at: string;
  /** Montants dans la devise de la facture — celle du règlement. */
  currency: Currency;
  invoiced_amount: number;
  matched_amount: number;
  unmatched_amount: number;
  /** Contre-valeurs en devise de référence, pour l'agrégation. */
  base_currency: Currency;
  base_matched_amount: number;
  base_unmatched_amount: number;
  exception_count: number;
  line_results?: MatchLineResult[];
  exceptions?: MatchException[];
  line_results_count?: number;
  exceptions_count?: number;
  created_at: string | null;
}

export interface MatchException {
  id: number;
  match_run_id: number;
  invoice_id: number;
  invoice_line_id: number | null;
  type: DiscrepancyType;
  type_label: string;
  severity: DiscrepancySeverity;
  is_overridable: boolean;
  message: string;
  context: Record<string, unknown>;
  review_status: ReviewStatus;
  review_status_label: string;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by?: { id: number; name: string } | null;
  invoice?: {
    id: number;
    reference: string;
    status: InvoiceStatus;
    supplier: { id: number; name: string } | null;
  };
  created_at: string | null;
}

// --- Factures et paiements -------------------------------------------------

export interface InvoiceLine {
  id: number;
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  invoiced_amount: number;
  purchase_order_line_id: number | null;
  purchase_order_line?: {
    id: number;
    line_number: number;
    item_code: string;
    unit: string;
    quantity_ordered: number;
    unit_price: number;
  } | null;
}

export type PaymentMethod = "transfer" | "check" | "card" | "cash" | "direct_debit";

export interface PaymentAuthorization {
  id: number;
  invoice_id: number;
  match_run_id: number;
  amount: number;
  currency: Currency;
  base_amount: number;
  base_currency: Currency;
  exchange_rate: number;
  status: PaymentAuthorizationStatus;
  status_label: string;
  authorized_at: string;
  /**
   * Le reglement s'ajoute a l'autorisation sans la remplacer : une facture
   * peut etre autorisee et non encore payee, ce que `status` seul ne dirait pas.
   */
  is_settled: boolean;
  settled_at: string | null;
  payment_reference: string | null;
  payment_method: PaymentMethod | null;
  settled_by?: { id: number; name: string } | null;
  invoice?: {
    id: number;
    reference: string;
    status: InvoiceStatus;
    supplier: { id: number; name: string } | null;
  };
}

export interface Invoice {
  id: number;
  reference: string;
  status: InvoiceStatus;
  status_label: string;
  currency: Currency;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  supplier?: Supplier;
  purchase_order_id: number;
  purchase_order?: {
    id: number;
    reference: string;
    status: PurchaseOrderStatus;
    currency: Currency;
    project: { id: number; code: string; name: string } | null;
  };
  lines?: InvoiceLine[];
  lines_count?: number;
  open_exceptions_count?: number;
  latest_match_run?: MatchRun | null;
  payment_authorization?: PaymentAuthorization | null;
  created_at: string | null;
}

// --- Supervision -----------------------------------------------------------

export interface DashboardSummary {
  invoices: Record<InvoiceStatus, number>;
  exceptions: {
    open: number;
    by_type: Partial<Record<DiscrepancyType, number>>;
    by_severity: Partial<Record<DiscrepancySeverity, number>>;
  };
  amounts: {
    /** Cumuls en devise de référence : seule unité qui permet d'additionner. */
    authorized_for_payment: number;
    blocked: number;
    currency: Currency;
    /** Ventilation par devise de règlement effective. */
    by_currency: Array<{ currency: Currency; amount: number; base_amount: number }>;
  };
}
