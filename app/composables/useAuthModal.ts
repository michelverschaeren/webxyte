/**
 * Stuurt de globale login-popup aan. Elk component kan hem openen (navbar,
 * productenpagina, route-middleware) zonder eigen state. Enkel inloggen —
 * er is geen publieke registratie, klanten krijgen hun account van een
 * beheerder.
 *
 * Schermen van de popup:
 *   - "login":        e-mail + wachtwoord
 *   - "magic":        inloglink per mail aanvragen
 *   - "forgot":       wachtwoord vergeten (ook via inloglink)
 *   - "sent":         bevestiging dat de mail verstuurd is
 *   - "new-password": nieuw wachtwoord kiezen na de link uit "forgot"
 */
export type AuthModalMode = "login" | "magic" | "forgot" | "sent" | "new-password";

export function useAuthModal() {
  const isOpen = useState<boolean>("auth-modal-open", () => false);
  const mode = useState<AuthModalMode>("auth-modal-mode", () => "login");

  function open(nextMode: AuthModalMode = "login") {
    mode.value = nextMode;
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return { isOpen, mode, open, close };
}
