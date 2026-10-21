import { eq, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, user } from "~~/server/database/schema";
import { auth } from "~~/server/utils/auth";
import { inviteCustomer } from "~~/server/utils/customer-login";
import { sendCustomerRequestMail } from "~~/server/utils/mail";
import { createRateLimiter } from "~~/server/utils/rate-limit";

/**
 * POST /api/customer-request — "klant worden" vanuit de login-popup.
 *
 * - Adres heeft al een login → inloglink per mail.
 * - Adres staat bij een klant die nog geen login heeft → login aanmaken en
 *   uitnodigen (zelfde als de knop in admin/klanten).
 * - Adres onbekend → de aanvraag gaat per mail naar de zaak.
 *
 * Het antwoord (`known`) verraadt of een adres gekend is; dat is hier de
 * bedoeling (andere melding op het scherm). De limiet per IP remt het
 * aftasten van adressen af.
 */
const bodySchema = z.object({
  // Better Auth bewaart e-mailadressen in kleine letters.
  email: z.string().trim().toLowerCase().pipe(z.email().max(200)),
});

/** Per IP: 5 aanvragen per 10 minuten. */
const rateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

export default defineEventHandler(async (event) => {
  const { email } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "onbekend";
  if (rateLimited(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: "Te veel aanvragen. Probeer het later opnieuw.",
    });
  }

  const [[login], [customer]] = await Promise.all([
    db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1),
    db
      .select({ id: customers.id })
      .from(customers)
      .where(raw`lower(${customers.contactEmail}) = ${email}`)
      .limit(1),
  ]);

  try {
    if (login) {
      await auth.api.signInMagicLink({
        body: {
          email,
          callbackURL: "/?login=ok",
          errorCallbackURL: "/?login=fout",
          metadata: { purpose: "login" },
        },
        headers: event.headers,
      });
      return { known: true };
    }

    if (customer) {
      await inviteCustomer(customer.id);
      return { known: true };
    }

    if (await sendCustomerRequestMail({ email })) return { known: false };
  } catch (err) {
    console.error(`[customer-request] Aanvraag van ${email} mislukt:`, err);
  }

  throw createError({
    statusCode: 503,
    statusMessage: "De aanvraag kon niet verstuurd worden. Probeer het later opnieuw.",
  });
});
