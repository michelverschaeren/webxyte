/**
 * Sessie-composable rond de Better Auth client.
 *
 *   const { user, isLoggedIn, isAdmin, login, logout } = useAuth();
 *
 * Geen `register()`: klanten krijgen hun account van een beheerder, er is
 * geen publieke registratie (zie server/utils/auth.ts, disableSignUp).
 *
 * Gebruikt `useAsyncData` zodat de sessie al tijdens SSR opgehaald wordt en
 * via de payload naar de browser gaat — geen tweede request, en geen "flits"
 * van uitgelogde UI. Op de server sturen we de cookie handmatig mee, want
 * SSR-fetches erven de browsercookies niet vanzelf.
 *
 * Vereist dat de site `authClient` levert (app/utils/auth-client.ts): welke
 * Better Auth-plugins de client gebruikt, verschilt per site.
 */
/** Vorm van /api/auth/get-session; `null` voor een gast. */
type AuthSession = Awaited<
  ReturnType<typeof authClient.getSession>
>["data"];

export function useAuth() {
  // `x-forwarded-for` gaat mee zodat Better Auth's rate limiter de SSR-call
  // per bezoeker telt; zonder IP belanden alle bezoekers in één gedeelde teller.
  const headers = import.meta.server
    ? useRequestHeaders(["cookie", "x-forwarded-for"])
    : undefined;

  const {
    data: session,
    status,
    refresh,
  } = useAsyncData("auth:session", async () => {
    // Tijdens SSR kent de Better Auth browser-client geen absolute basis-URL,
    // dus halen we de sessie daar via Nitro's interne route op (met cookie).
    if (import.meta.server) {
      return await $fetch<AuthSession>("/api/auth/get-session", { headers });
    }

    const { data } = await authClient.getSession();
    return data;
  });

  const user = computed(() => session.value?.user ?? null);
  const isLoggedIn = computed(() => user.value !== null);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isPending = computed(() => status.value === "pending");

  async function login(email: string, password: string) {
    const result = await authClient.signIn.email({ email, password });
    if (!result.error) await refresh();
    return result;
  }

  async function logout() {
    await authClient.signOut();
    session.value = null;
    // Sites ruimen hier hun eigen state op (winkelmand, lijsten, …) via
    // nuxtApp.hook("auth:logout", …) in een plugin.
    await useNuxtApp().callHook("auth:logout");
    await navigateTo("/");
  }

  return {
    session,
    user,
    isLoggedIn,
    isAdmin,
    isPending,
    refresh,
    login,
    logout,
  };
}
