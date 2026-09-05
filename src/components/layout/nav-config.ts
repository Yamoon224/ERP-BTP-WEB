import type { ComponentType } from "react";
import {
  IconBanknote,
  IconBuilding,
  IconCrane,
  IconDashboard,
  IconDelivery,
  IconException,
  IconBilling,
  IconPayment,
  IconHistory,
  IconPurchaseOrder,
  IconShield,
  IconUsers,
} from "@/components/ui/icons";
import type { IconProps } from "@/components/ui/icons";

/**
 * Navigation principale. Chaque entree porte la permission qui la rend utile :
 * afficher un lien qui menera a un 403 est une mauvaise experience, et masquer
 * la navigation d'un role qui ne peut rien y faire clarifie son perimetre.
 *
 * L'icone n'est pas decorative : barre laterale reduite, elle devient le seul
 * repere du lien. Elle doit donc etre distinctive avant d'etre jolie.
 */
export interface NavItem {
  href: string;
  label: string;
  permission: string;
  description: string;
  icon: ComponentType<IconProps>;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    permission: "matching.view",
    description: "Montants autorises, montants bloques, charge de revue",
    icon: IconDashboard,
  },
  {
    href: "/suppliers",
    label: "Fournisseurs",
    permission: "procurement.view",
    description: "Qui nous facture — le referentiel d'ou part le circuit",
    icon: IconBuilding,
  },
  {
    href: "/projects",
    label: "Chantiers",
    permission: "procurement.view",
    description: "Les affaires sur lesquelles les achats sont engages",
    icon: IconCrane,
  },
  {
    href: "/purchase-orders",
    label: "Bons de commande",
    permission: "procurement.view",
    description: "Ce qui a ete engage aupres des fournisseurs",
    icon: IconPurchaseOrder,
  },
  {
    href: "/delivery-notes",
    label: "Bons de livraison",
    permission: "receiving.view",
    description: "Ce qui a ete recu et controle",
    icon: IconDelivery,
  },
  {
    href: "/invoices",
    label: "Factures",
    permission: "invoicing.view",
    description: "Creances fournisseurs et leur rapprochement",
    icon: IconBilling,
  },
  {
    href: "/match-runs",
    label: "Rapprochements",
    permission: "matching.view",
    description: "Registre des executions du moteur, immuables",
    icon: IconShield,
  },
  {
    href: "/exceptions",
    label: "Ecarts a arbitrer",
    permission: "matching.view",
    description: "File de revue humaine",
    icon: IconException,
  },
  {
    href: "/payments",
    label: "Autorisations de paiement",
    permission: "payments.view",
    description: "Ce qui est aujourd'hui payable",
    icon: IconPayment,
  },
  {
    href: "/currencies",
    label: "Devises et taux",
    permission: "currencies.view",
    description: "Referentiel des devises et historique des cotations",
    icon: IconBanknote,
  },
  {
    href: "/audit",
    label: "Journal d'audit",
    permission: "audit.view",
    description: "Qui a change quoi, quand — en lecture seule",
    icon: IconHistory,
  },
  {
    href: "/users",
    label: "Utilisateurs",
    permission: "users.view",
    description: "Comptes, roles et separation des taches",
    icon: IconUsers,
  },
];
