/**
 * Sessie-composable rond de Better Auth client.
 *
 *   const { user, isLoggedIn, isAdmin, login, logout } = useAuth();
 *
 * Gebruikt `useAsyncData` zodat de sessie al tijdens SSR opgehaald wordt en
 * via de payload naar de browser gaat — geen tweede request, en geen "flits"
 * van uitgelogde UI. Op de server sturen we de cookie handmatig mee, want
 * SSR-fetches erven de browsercookies niet vanzelf.
 */
/** Vorm van /api/auth/get-session; `null` voor een gast. */
type AuthSession = Awaited<
  ReturnType<typeof authClient.getSession>
>["data"];

export function useAuth() {
  const headers = import.meta.server
    ? useRequestHeaders(["cookie"])
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

  async function register(name: string, email: string, password: string) {
    const result = await authClient.signUp.email({ name, email, password });
    if (!result.error) await refresh();
    return result;
  }

  async function logout() {
    await authClient.signOut();
    session.value = null;
    useOrderLists().reset();
    useCart().reset();
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
    register,
    logout,
  };
}
