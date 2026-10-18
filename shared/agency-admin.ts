/**
 * De beheerder van de website (agency). Enkel dit account mag onomkeerbare
 * acties uitvoeren, zoals klanten of bestellingen verwijderen. De klant
 * (eigenaar van de webshop) heeft zelf ook de rol "admin", maar niet deze
 * rechten. Gewoon TS zonder Nuxt-imports: server (afdwingen, zie
 * requireAgencyAdmin) en beheerpagina's (knoppen tonen) delen dezelfde regel.
 */
export const AGENCY_ADMIN_EMAIL = "web.xyte@outlook.com";

export function isAgencyAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === AGENCY_ADMIN_EMAIL;
}
