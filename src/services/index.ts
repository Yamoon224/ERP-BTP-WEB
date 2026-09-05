/**
 * Services d'accès à l'API, un module par domaine backend.
 *
 * Ce sont les seules fonctions autorisées à connaître les URL de l'API. Les
 * composants et les hooks appellent ces services ; ils ne construisent jamais
 * de chemin eux-mêmes. Renommer un endpoint se règle donc dans un seul
 * fichier, pas dans quinze composants.
 */

export * as authService from "./auth-service";
export * as purchaseOrderService from "./purchase-order-service";
export * as deliveryNoteService from "./delivery-note-service";
export * as invoiceService from "./invoice-service";
export * as matchingService from "./matching-service";
export * as referenceService from "./reference-service";
export * as paymentService from "./payment-service";
export * as dashboardService from "./dashboard-service";
export * as userService from "./user-service";
export * as currencyService from "./currency-service";
export * as auditService from "./audit-service";
