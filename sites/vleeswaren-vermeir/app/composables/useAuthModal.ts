/**
 * Stuurt de globale login-popup aan. Elk component kan hem openen (navbar,
 * productenpagina, route-middleware) zonder eigen state. Er is geen publieke
 * registratie: klanten krijgen hun account van een beheerder. Wie nog geen
 * klant is, kan via "request" wel een aanvraag naar de zaak sturen.
 *
 * Schermen van de popup:
 *   - "login":        e-mail + wachtwoord
 *   - "magic":        inloglink per mail aanvragen
 *   - "forgot":       wachtwoord vergeten (ook via inloglink)
 *   - "request":      klant worden (e-mailadres doorsturen naar de zaak)
 *   - "sent":         bevestiging dat de mail verstuurd is
 *   - "new-password": nieuw wachtwoord kiezen na de link uit "forgot"
 */
export type AuthModalMode =
  | "login"
  | "magic"
  | "forgot"
  | "request"
  | "sent"
  | "new-password";

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
