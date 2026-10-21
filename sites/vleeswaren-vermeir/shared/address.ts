/**
 * Leveringsadressen van klanten. Gewoon TS zonder Nuxt-imports, zodat de app
 * (formulieren) en de Nitro-server (validatie) dezelfde regels gebruiken.
 */

/** Een leveringsadres zoals de API het teruggeeft; het primaire staat eerst. */
export interface DeliveryAddress {
  id: string;
  street: string;
  postalCode: string;
  city: string;
  isPrimary: boolean;
}

/** Belgische postcode: 4 cijfers. */
export const POSTAL_CODE_PATTERN = /^\d{4}$/;

export const POSTAL_CODE_ERROR = "Vul een geldige postcode in (4 cijfers).";
export const ADDRESS_ERROR = "Vul straat en nummer, postcode en gemeente in.";

/** Controleert een ingevuld adres; geeft de foutmelding of `null` als het klopt. */
export function addressError(address: {
  street: string;
  postalCode: string;
  city: string;
}): string | null {
  if (!address.street.trim() || !address.postalCode.trim() || !address.city.trim()) {
    return ADDRESS_ERROR;
  }
  return POSTAL_CODE_PATTERN.test(address.postalCode.trim()) ? null : POSTAL_CODE_ERROR;
}
