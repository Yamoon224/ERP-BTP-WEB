import type { SVGProps } from "react";

/**
 * Jeu d'icones maison.
 *
 * Ecrit a la main plutot qu'importe d'une librairie : l'interface n'a besoin
 * que d'une vingtaine de pictogrammes, tous du meme trait (1.6px, arrondi), et
 * une dependance de plusieurs milliers d'icones pour cela alourdirait le
 * bundle sans rien apporter. Toutes heritent de `currentColor`, donc du theme.
 */

export type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      // Taille par defaut surchargeable par `className`.
      className="h-4 w-4 shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Logo applicatif : une facture. */
export function IconBilling(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2.5h9.2L20 7.2V21l-2.6-1.5-2.6 1.5-2.6-1.5L9.6 21 7 19.5 4 21V6a3.5 3.5 0 0 1 2-3.5Z" />
      <path d="M14.8 2.6V7.4H19.8" />
      <path d="M8.4 10.5h7.2M8.4 14.2h4.8" />
    </Icon>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.6" />
    </Icon>
  );
}

export function IconPurchaseOrder(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5h8a2 2 0 0 1 2 2V20a1 1 0 0 1-1.5.87L12 18.4l-4.5 2.47A1 1 0 0 1 6 20V5.5a2 2 0 0 1 2-2Z" />
      <path d="M9.5 8h5M9.5 11.5h3" />
    </Icon>
  );
}

export function IconDelivery(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7.5h10v9H3z" />
      <path d="M13 11h3.6l3.4 3.2v2.3H13z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </Icon>
  );
}

export function IconException(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.8 21 19.5H3L12 3.8Z" />
      <path d="M12 10v4.2M12 17.4h.01" />
    </Icon>
  );
}

export function IconPayment(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.4" />
      <path d="M2.5 10h19M6.5 14.8h3.5" />
    </Icon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </Icon>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m14.5 5-6.5 7 6.5 7" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 5 6.5 7-6.5 7" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 9 7 6.5L19 9" />
    </Icon>
  );
}

export function IconEye(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 12S6.2 5.8 12 5.8 21.5 12 21.5 12 17.8 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c5.8 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3.2 3.9M6.4 7A17 17 0 0 0 2.5 11.2S6.2 17.4 12 17.4a9.4 9.4 0 0 0 3.8-.8" />
      <path d="M10 9.5a3 3 0 0 0 4.2 4.2" />
      <path d="m3.5 3 17 17.5" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />
    </Icon>
  );
}

export function IconGavel(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m13.6 3.6 6.8 6.8-2.4 2.4-6.8-6.8z" />
      <path d="m10.6 9.6 3.8 3.8-7.2 7.2-3.8-3.8z" />
      <path d="M14.6 19.8h6.2" />
    </Icon>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.4 4.4v4.4H16" />
    </Icon>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function IconPanelLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.4" />
      <path d="M9.5 4v16" />
    </Icon>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </Icon>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
    </Icon>
  );
}

export function IconMonitor(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.8" y="4" width="18.4" height="12.5" rx="2.2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </Icon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.6 20.2a7.6 7.6 0 0 1 14.8 0" />
    </Icon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5H18a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3.5" />
      <path d="M10 8.2 6 12l4 3.8M6 12h10" />
    </Icon>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.8 5.8v5.4c0 4.3 3 8.2 7.2 9.6 4.2-1.4 7.2-5.3 7.2-9.6V5.8L12 3Z" />
      <path d="m9 12 2.2 2.2L15.3 10" />
    </Icon>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
      <path d="m3.6 7 8.4 6 8.4-6" />
    </Icon>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.2" />
      <path d="M8 10V7.6a4 4 0 0 1 8 0V10" />
    </Icon>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15M14 6.2 19.8 12 14 17.8" />
    </Icon>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.5 4.5H19.5V10.5" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </Icon>
  );
}

/**
 * Indicateurs de tri. Trois etats distincts plutot qu'une fleche qui pivote :
 * « non trie » doit se lire comme une invitation, pas comme un ordre deja
 * applique.
 */
export function IconSortNeutral(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 9.5 12 5.5l4 4" />
      <path d="M8 14.5 12 18.5l4-4" />
    </Icon>
  );
}

export function IconSortAscending(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5.5M12 5.5 7 10.5M12 5.5l5 5" />
    </Icon>
  );
}

export function IconSortDescending(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v13.5M12 18.5 7 13.5M12 18.5l5-5" />
    </Icon>
  );
}

/** Reduire / deployer la barre laterale, pose sur la ligne qui l'en separe. */
export function IconChevronsLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m13 6.5-5.5 5.5 5.5 5.5" />
      <path d="m18.5 6.5-5.5 5.5 5.5 5.5" />
    </Icon>
  );
}

export function IconChevronsRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m11 6.5 5.5 5.5-5.5 5.5" />
      <path d="m5.5 6.5 5.5 5.5-5.5 5.5" />
    </Icon>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
      <path d="M10.5 10.5v6M13.5 10.5v6" />
    </Icon>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16v3.5Z" />
      <path d="m14.5 6.5 3 3" />
    </Icon>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6" />
      <path d="M17.5 14.6a6 6 0 0 1 3 5.4" />
    </Icon>
  );
}

/** Reglement effectif : le billet qui part une fois l'autorisation acquise. */
export function IconBanknote(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.6" y="6" width="18.8" height="12" rx="2.2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" />
    </Icon>
  );
}

export function IconKey(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7.8" cy="15.8" r="3.6" />
      <path d="m10.6 13.2 7.6-7.6" />
      <path d="m15.6 8.2 2 2M18 5.8l2 2" />
    </Icon>
  );
}

/**
 * Fournisseur : un batiment d'entreprise. Distinct de `IconUsers`, qui coiffe
 * les comptes de l'application - barre laterale reduite, l'icone est le seul
 * repere du lien, et deux entrees qui partagent la meme deviennent
 * indiscernables.
 */
export function IconBuilding(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.4 20.6h17.2" />
      <path d="M5.4 20.6V4.4a1 1 0 0 1 1-1h7.2a1 1 0 0 1 1 1v16.2" />
      <path d="M14.6 9.4h3.6a1 1 0 0 1 1 1v10.2" />
      <path d="M8.2 7.2h3.4M8.2 11h3.4M8.2 14.8h3.4" />
    </Icon>
  );
}

/** Chantier : une grue de levage. */
export function IconCrane(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.6 20.6h6.4" />
      <path d="M7.8 20.6V4.6" />
      <path d="M3 8.2h16.4" />
      <path d="m7.8 4.6 4.4 3.6" />
      <path d="M16.6 8.2v3.4" />
      <path d="M14.4 11.6h4.4v3.2h-4.4z" />
    </Icon>
  );
}

/** Journal d'audit : une horloge a rebours, l'historique des mouvements. */
export function IconHistory(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.6 12a8.4 8.4 0 1 0 2.5-6" />
      <path d="M3.4 3.6v3.8h3.8" />
      <path d="M12 7.6V12l3 1.8" />
    </Icon>
  );
}
