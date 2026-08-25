/**
 * Beveiligt de klantenzone. Niet-ingelogde bezoekers gaan terug naar de
 * homepage; in de browser opent meteen de login-popup zodat ze niet op een
 * lege pagina belanden.
 */
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();

  // De sessie wordt via useAsyncData opgehaald, maar die is in middleware nog
  // niet noodzakelijk klaar — vandaar expliciet wachten zolang we niets weten.
  // Eens de sessie geladen is, kost dit geen extra request meer.
  if (!auth.session.value) await auth.refresh();

  if (auth.isLoggedIn.value) return;

  if (import.meta.client) useAuthModal().open();

  return navigateTo("/");
});
