/**
 * Bij afmelden (useAuth uit @webxyte/auth) de bestellijsten en de winkelmand
 * van deze site leegmaken, zodat de volgende gebruiker op dit toestel niets
 * van de vorige ziet.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("auth:logout", () => {
    useOrderLists().reset();
    useCart().reset();
  });
});
