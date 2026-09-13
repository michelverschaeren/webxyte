export function useSiteLock() {
  const config = useRuntimeConfig();

  const unlocked = useCookie<boolean>("site-unlocked", {
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
    sameSite: "lax",
  });

  const locked = computed(() => !unlocked.value);

  function unlock(): void {
    unlocked.value = true;
  }

  function tryUnlock(password: string): boolean {
    if (password.length > 0 && password === config.public.sitePassword) {
      unlock();
      return true;
    }
    return false;
  }

  return { locked, unlock, tryUnlock };
}
