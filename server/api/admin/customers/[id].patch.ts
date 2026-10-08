import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, user } from "~~/server/database/schema";
import { isUniqueViolation } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * PATCH /api/admin/customers/:id — naam en contactgegevens van een
 * CRM-klant aanvullen of wijzigen. Lege velden worden als `null` opgeslagen.
 *
 * Het klantnummer is de sleutel naar het CRM-pakket (import en bestelmails
 * gebruiken het), dus dat wijzigt enkel in uitzonderlijke gevallen en moet
 * uniek blijven.
 *
 * Het contactadres is ook de login: heeft de klant er al een, dan verandert
 * het login-adres mee, en kan het adres niet leeggemaakt worden.
 */
const paramsSchema = z.object({ id: z.uuid() });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null));

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  customerNr: z.string().trim().min(1).max(32).optional(),
  contactEmail: z
    .union([z.string().trim().toLowerCase().pipe(z.email().max(200)), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  phone: optionalText(40),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const [current] = await db
    .select({
      userId: customers.userId,
      contactEmail: customers.contactEmail,
      customerNr: customers.customerNr,
      name: customers.name,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }

  const emailChanged =
    body.contactEmail !== undefined && body.contactEmail !== current.contactEmail;
  if (emailChanged && current.userId && !body.contactEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Deze klant heeft een login; het e-mailadres mag niet leeg zijn.",
    });
  }

  if (body.customerNr !== undefined && body.customerNr !== current.customerNr) {
    const [taken] = await db
      .select({ name: customers.name })
      .from(customers)
      .where(and(eq(customers.customerNr, body.customerNr), ne(customers.id, id)))
      .limit(1);
    if (taken) {
      throw createError({
        statusCode: 409,
        statusMessage: `Klantnummer ${body.customerNr} is al in gebruik door ${taken.name}.`,
      });
    }
  }

  // De login kreeg bij de uitnodiging de klantnaam mee; hou die gelijk.
  const nameChanged = body.name !== undefined && body.name !== current.name;

  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(customers)
        .set(body)
        .where(eq(customers.id, id))
        .returning();

      if (emailChanged && current.userId && body.contactEmail) {
        await tx
          .update(user)
          .set({ email: body.contactEmail })
          .where(eq(user.id, current.userId));
      }
      if (nameChanged && current.userId) {
        await tx
          .update(user)
          .set({ name: body.name })
          .where(eq(user.id, current.userId));
      }

      return updated!;
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Dit e-mailadres of klantnummer hoort al bij een andere klant of login.",
      });
    }
    throw err;
  }
});
