import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * PATCH /api/admin/products/:id — bewerkt een bestaand product. Het
 * artikelnummer zelf wordt niet aangepast: dat is de natuurlijke sleutel en
 * staat als bevroren snapshot in bestelhistoriek (order_items.articleNr).
 */
const paramsSchema = z.object({ id: z.uuid() });

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  supplier: z.string().trim().min(1).max(200).optional(),
  categoryId: z.uuid().optional(),
  unit: z.string().trim().max(64).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const [updated] = await db
    .update(products)
    .set({
      ...body,
      price:
        body.price === undefined ? undefined : (body.price?.toFixed(2) ?? null),
    })
    .where(eq(products.id, id))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  return { ...updated, price: updated.price ? Number(updated.price) : null };
});
