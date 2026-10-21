import { z } from "zod";
import { db } from "~~/server/database/client";
import { requireUser } from "~~/server/utils/session";

/**
 * GET /api/products/:id
 * Eén product met zijn categorie, via de relationele query-API van Drizzle.
 * Enkel voor ingelogde klanten: het volledige product bevat fabrikant,
 * artikelnummer en productfiche.
 */
const paramsSchema = z.object({
  id: z.uuid("Ongeldig product-id."),
});

export default defineEventHandler(async (event) => {
  await requireUser(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const product = await db.query.products.findFirst({
    // Adviesprijs en interne notitie zijn enkel voor beheerders
    // (zie /api/admin/products/:id).
    columns: { price: false, notes: false },
    where: (fields, { and, eq }) =>
      and(eq(fields.id, id), eq(fields.isActive, true)),
    with: {
      category: {
        columns: { id: true, slug: true, name: true, emoji: true },
      },
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product niet gevonden.",
    });
  }

  return product;
});
