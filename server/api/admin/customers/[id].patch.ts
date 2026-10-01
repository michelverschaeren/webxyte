import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, user } from "~~/server/database/schema";
import { isUniqueViolation } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * PATCH /api/admin/customers/:id — contact- en levergegevens van een
 * CRM-klant aanvullen of wijzigen. Klantnummer en naam blijven buiten schot:
 * die komen uit het CRM. Lege velden worden als `null` opgeslagen.
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
  contactEmail: z
    .union([z.string().trim().toLowerCase().pipe(z.email().max(200)), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  phone: optionalText(40),
  deliveryStreet: optionalText(200),
  deliveryPostalCode: optionalText(16),
  deliveryCity: optionalText(120),
  deliveryCountry: z.string().trim().min(1).max(120).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const [current] = await db
    .select({ userId: customers.userId, contactEmail: customers.contactEmail })
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

      return updated!;
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw createError({
        statusCode: 409,
        statusMessage: "Dit e-mailadres hoort al bij een andere klant of login.",
      });
    }
    throw err;
  }
});
