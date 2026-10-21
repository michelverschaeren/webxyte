import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { orders } from "~~/server/database/schema";
import { requireAgencyAdmin } from "#layers/auth/server/utils/session";

/**
 * DELETE /api/admin/orders/:id — verwijdert één bestelling definitief, met
 * haar regels (cascade op order_items). Voorbehouden aan de agency-admin;
 * de beheerpagina vraagt eerst om het bestelnummer over te typen.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAgencyAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const [deleted] = await db
    .delete(orders)
    .where(eq(orders.id, id))
    .returning({ id: orders.id });

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bestelling niet gevonden.",
    });
  }

  return { deleted: deleted.id };
});
