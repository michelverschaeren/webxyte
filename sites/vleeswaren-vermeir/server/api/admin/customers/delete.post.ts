import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, user } from "~~/server/database/schema";
import { requireAgencyAdmin } from "#layers/auth/server/utils/session";

/**
 * POST /api/admin/customers/delete — verwijdert een selectie klanten uit het
 * CRM. Heeft een klant een login, dan verdwijnt die login (met sessies en
 * accounts, via cascade) mee — anders kan die persoon na de "verwijdering"
 * nog altijd inloggen. Voorbehouden aan de agency-admin.
 */
const bodySchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

export default defineEventHandler(async (event) => {
  await requireAgencyAdmin(event);

  const { ids } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const rows = await db
    .select({ id: customers.id, userId: customers.userId })
    .from(customers)
    .where(inArray(customers.id, ids));

  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Geen klanten gevonden." });
  }

  const userIds = rows
    .map((r) => r.userId)
    .filter((id): id is string => id !== null);

  await db.transaction(async (tx) => {
    await tx.delete(customers).where(inArray(customers.id, ids));
    if (userIds.length > 0) {
      await tx.delete(user).where(inArray(user.id, userIds));
    }
  });

  return { deleted: rows.length };
});
