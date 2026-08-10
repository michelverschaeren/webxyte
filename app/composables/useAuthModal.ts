export type AuthModalTab = "login" | "register";

/**
 * Stuurt de globale login/registratie-popup aan. Elk component kan hem
 * openen (navbar, winkelmandje, route-middleware) zonder eigen state.
 */
export function useAuthModal() {
  const isOpen = useState<boolean>("auth-modal-open", () => false);
  const tab = useState<AuthModalTab>("auth-modal-tab", () => "login");

  function open(target: AuthModalTab = "login") {
    tab.value = target;
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return { isOpen, tab, open, close };
}
