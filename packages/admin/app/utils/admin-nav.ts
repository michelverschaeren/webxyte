/**
 * Menu-items van de beheerzijbalk; ook de bron voor de breadcrumb.
 *
 * Elke layer en de site voegen hun eigen items toe via app.config.ts onder
 * `admin.nav.<sleutel>` (objecten worden samengevoegd, de site wint bij
 * dezelfde sleutel). `order` bepaalt de volgorde: deze layer zet Overzicht
 * op 0, @webxyte/analytics Bezoekers op 90; site-items zitten daartussen.
 * Zet een item op `false` om het te verbergen.
 */
export interface AdminNavLink {
  to: string;
  label: string;
  /** SVG-pad (`d`) van een 24x24 outline-icoon. */
  icon: string;
  order?: number;
}

export function useAdminNavLinks(): AdminNavLink[] {
  const nav = (useAppConfig().admin?.nav ?? {}) as Record<string, AdminNavLink | false>;
  return Object.values(nav)
    .filter((link): link is AdminNavLink => Boolean(link))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

/** Open/dicht-status van de zijbalk-lade op mobiel (layout + topbalk). */
export function useAdminDrawer() {
  return useState("admin-drawer", () => false);
}

const WIDE_STORAGE_KEY = "admin-wide";

/**
 * Beheerinhoud over de volle breedte i.p.v. boxed. Per browser onthouden in
 * `localStorage`; de server kent de keuze niet, dus tijdens SSR altijd boxed
 * en layouts/admin.vue haalt de bewaarde keuze op na mount.
 */
export function useAdminWide() {
  const wide = useState("admin-wide", () => false);

  function load() {
    try {
      wide.value = localStorage.getItem(WIDE_STORAGE_KEY) === "1";
    } catch {
      // Opslag geblokkeerd: boxed blijven.
    }
  }

  function toggle() {
    wide.value = !wide.value;
    try {
      localStorage.setItem(WIDE_STORAGE_KEY, wide.value ? "1" : "0");
    } catch {
      // Keuze geldt dan enkel voor deze sessie.
    }
  }

  return { wide, load, toggle };
}
