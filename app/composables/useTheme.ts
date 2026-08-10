export type Theme = "dark" | "light";

/**
 * Donker/licht thema, per bezoeker onthouden via een cookie — zelfde
 * SSR-veilige patroon als `useSiteLock`. `data-theme` wordt hierop gezet
 * (zie app.vue), zodat de eerste render al het juiste thema toont.
 */
export function useTheme() {
  const theme = useCookie<Theme>("theme", {
    default: () => "dark",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggle };
}
