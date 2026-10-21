import type { H3Event } from "h3";
import { isAgencyAdminEmail } from "../../shared/agency-admin";
import { auth, type AuthSession } from "./auth";

/**
 * Leest de sessie uit de request-cookies. Geeft `null` voor een gast.
 * Bewust níét `getSession` genoemd: die naam is al van h3 en zou de
 * auto-import ervan overschrijven.
 *
 * `auth.api.getSession`'s eigen returntype kent onze `role`-additionalField
 * niet (een gekende Better Auth-beperking — dat werkt enkel via `$Infer`),
 * vandaar de cast naar `AuthSession`: op runtime staat `role` er wél op.
 */
export async function getAuthSession(event: H3Event) {
  return auth.api.getSession({ headers: event.headers }) as Promise<
    AuthSession | null
  >;
}

/**
 * Guard voor beveiligde endpoints: geeft de ingelogde gebruiker terug
 * of gooit een 401. Gebruik bovenaan een handler:
 *
 *   const user = await requireUser(event);
 */
export async function requireUser(event: H3Event) {
  const session = await getAuthSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Niet ingelogd.",
    });
  }

  return session.user;
}

/**
 * Zelfde als requireUser, maar eist ook de rol "admin" (403 zo niet).
 */
export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event);

  if (user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Geen beheerdersrechten.",
    });
  }

  return user;
}

/**
 * Zelfde als requireAdmin, maar enkel voor de agency-admin (403 zo niet):
 * voor onomkeerbare acties zoals klanten of bestellingen verwijderen. Zie
 * shared/agency-admin.ts.
 */
export async function requireAgencyAdmin(event: H3Event) {
  const user = await requireAdmin(event);

  if (!isAgencyAdminEmail(user.email)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Deze actie is voorbehouden aan de beheerder van de website.",
    });
  }

  return user;
}
