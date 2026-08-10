/**
 * Beveiligt de admin-zone. Niet-ingelogden en klanten zonder de rol "admin"
 * gaan terug naar de homepage — zelfde patroon als middleware/account.ts.
 */
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();

  if (!auth.session.value) await auth.refresh();

  if (auth.isAdmin.value) return;

  return navigateTo("/");
});
