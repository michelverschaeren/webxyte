/**
 * The website's builder (agency). Only this account may run irreversible
 * actions such as deleting customers or orders; the client (site owner) also
 * has role "admin" but not these rights. Plain TS without Nuxt imports: the
 * server (enforce, requireAgencyAdmin) and admin pages (show buttons) share
 * one rule. See skill admin-conventions.
 */
export const AGENCY_ADMIN_EMAIL = 'web.xyte@outlook.com'

export function isAgencyAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === AGENCY_ADMIN_EMAIL
}
