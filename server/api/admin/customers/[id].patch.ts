import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * PATCH /api/admin/customers/:id — contact- en levergegevens van een
 * CRM-klant aanvullen of wijzigen. Klantnummer en naam blijven buiten schot:
 * die komen uit het CRM. Lege velden worden als `null` opgeslagen.
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
    .union([z.email().max(200), z.literal(""), z.null()])
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

  const [updated] = await db
    .update(customers)
    .set(body)
    .where(eq(customers.id, id))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }

  return updated;
});
