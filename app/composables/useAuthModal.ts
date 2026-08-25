/**
 * Stuurt de globale login-popup aan. Elk component kan hem openen (navbar,
 * productenpagina, route-middleware) zonder eigen state. Enkel inloggen —
 * er is geen publieke registratie, klanten krijgen hun account van een
 * beheerder.
 */
export function useAuthModal() {
  const isOpen = useState<boolean>("auth-modal-open", () => false);

  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return { isOpen, open, close };
}
