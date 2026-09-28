import { z } from "zod";
import { auth } from "~~/server/utils/auth";
import { getAuthSession } from "~~/server/utils/session";

/**
 * POST /api/account/password — nieuw wachtwoord instellen na "wachtwoord
 * vergeten" (de klant is dan net ingelogd via de magic link).
 *
 * Vraagt bewust níét naar het huidige wachtwoord (dat is de klant net
 * vergeten). Ter compensatie mag dit enkel met een verse sessie: wie een
 * oude, gestolen sessie heeft, kan zo het wachtwoord niet overnemen.
 *
 * Een klant zonder e-mailbevestiging verliest bij de eerste magic-link-login
 * zijn wachtwoord-account (Better Auth-beveiliging) — vandaar dat we het
 * credential-account zo nodig opnieuw aanmaken i.p.v. enkel bij te werken.
 */
const FRESH_SESSION_MS = 15 * 60 * 1000;

const bodySchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Niet ingelogd." });
  }

  const createdAt = new Date(session.session.createdAt).getTime();
  if (Date.now() - createdAt > FRESH_SESSION_MS) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Deze sessie is te oud. Vraag via 'Wachtwoord vergeten' een nieuwe link aan.",
    });
  }

  const { newPassword } = await readValidatedBody(event, (data) =>
    bodySchema.parse(data),
  );

  const ctx = await auth.$context;
  const userId = session.user.id;
  const hash = await ctx.password.hash(newPassword);

  const accounts = await ctx.internalAdapter.findAccounts(userId);
  if (accounts.some((a) => a.providerId === "credential")) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: "credential",
      accountId: userId,
      password: hash,
    });
  }

  // Andere toestellen uitloggen: wie het oude wachtwoord kende, is eruit.
  await auth.api.revokeOtherSessions({ headers: event.headers });

  return { ok: true };
});
