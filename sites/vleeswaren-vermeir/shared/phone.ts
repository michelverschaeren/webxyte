/**
 * Telefoonnummers van klanten. Gewoon TS zonder Nuxt-imports, zodat de app
 * (formulieren) en de Nitro-server (validatie) dezelfde regel gebruiken.
 */

/** Melding bij een onvolledig of ongeldig nummer. */
export const PHONE_ERROR =
  "Vul een volledig telefoonnummer in, bv. 015 61 15 39 of 0475 12 34 56.";

/**
 * Een volledig nummer: 9 tot 15 cijfers, met enkel de gebruikelijke
 * scheidingstekens (spatie, +, /, ., -, haakjes). Zo komt er geen half
 * ingetikt nummer op de bestelbon.
 */
export function isValidPhone(value: string): boolean {
  if (!/^[\d\s+/.()-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= 9 && digits <= 15;
}
