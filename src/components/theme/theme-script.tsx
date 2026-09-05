import { DARK_MEDIA_QUERY, DEFAULT_THEME, THEME_STORAGE_KEY } from "./theme-constants";

/**
 * Applique le theme avant le premier rendu du navigateur.
 *
 * Sans ce script, une page choisie en sombre s'afficherait blanche le temps
 * que React s'hydrate : un flash blanc en pleine nuit est exactement ce que le
 * mode sombre est cense eviter.
 */
const SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||${JSON.stringify(DEFAULT_THEME)};var d=s==="dark"||(s==="system"&&window.matchMedia(${JSON.stringify(DARK_MEDIA_QUERY)}).matches);var e=document.documentElement;e.classList.toggle("dark",d);e.dataset.theme=d?"dark":"light";}catch(_){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
