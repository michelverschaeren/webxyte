export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

/**
 * Donker/licht thema, client-side onthouden in `localStorage`.
 *
 * Bewust géén cookie meer: `useCookie` schreef bij élke SSR-render een
 * `Set-Cookie`-header, en een response met `Set-Cookie` mag door geen enkele
 * gedeelde cache bewaard worden. Het thema is puur een weergavekeuze — de
 * server hoeft die niet te kennen.
 *
 * Gevolg: tijdens SSR is deze waarde altijd `"dark"`. Wat van het thema
 * afhangt én zichtbaar is bij de eerste paint (logo's, het icoon van de
 * themaknop) mag dus NIET op deze reactieve waarde schakelen, maar via CSS op
 * `[data-theme]`. Dat attribuut zet een inline script in <head> (zie
 * nuxt.config.ts) nog vóór de eerste paint, en `app/plugins/theme.client.ts`
 * trekt deze state daarna gelijk.
 */
export function useTheme() {
  const theme = useState<Theme>("theme", () => "dark");

  function set(next: Theme) {
    theme.value = next;
    // Het `data-theme`-attribuut zelf wordt door unhead beheerd (app.vue),
    // dus hier enkel bewaren — anders vechten twee schrijvers om hetzelfde
    // attribuut.
    if (import.meta.client) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Private mode of volle storage: de keuze geldt dan enkel deze sessie.
      }
    }
  }

  function toggle() {
    set(theme.value === "dark" ? "light" : "dark");
  }

  return { theme, toggle, set };
}
