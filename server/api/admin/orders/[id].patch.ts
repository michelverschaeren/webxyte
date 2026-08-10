import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { ORDER_STATUSES, orders } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/** PATCH /api/admin/orders/:id — status van een bestelling wijzigen. */
const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ status: z.enum(ORDER_STATUSES) });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const { status } = await readValidatedBody(event, (data) =>
    bodySchema.parse(data),
  );

  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bestelling niet gevonden.",
    });
  }

  return updated;
});
