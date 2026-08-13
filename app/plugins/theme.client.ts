import type { Theme } from "~/composables/useTheme";
import { THEME_STORAGE_KEY } from "~/composables/useTheme";

/**
 * Trekt de opgeslagen themakeuze in de Vue-state, vóór de app mount.
 *
 * Het inline script in <head> heeft `data-theme` op dat moment al goed gezet;
 * dit zorgt dat de reactieve waarde daarmee overeenkomt. Zonder deze stap zou
 * unhead het attribuut bij hydratie terugzetten op de SSR-default "dark" en
 * zag een bezoeker met het lichte thema alsnog een flits.
 */
export default defineNuxtPlugin(() => {
  const theme = useState<Theme>("theme", () => "dark");

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      theme.value = stored;
    }
  } catch {
    // Geen storage beschikbaar: de default blijft staan.
  }
});
