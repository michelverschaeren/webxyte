import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";

/**
 * GET /api/categories/:slug
 * Eén categorie met het aantal actieve producten — voedt de publieke
 * categoriepagina (/assortiment/:slug). Een categorie zonder actieve
 * producten bestaat voor bezoekers niet: dat voorkomt lege pagina's in de
 * index. Bewust geen fabrikanten of producten in het antwoord: die horen niet
 * op publieke, crawlbare pagina's.
 */
const paramsSchema = z.object({ slug: z.string().min(1) });

export default defineEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const category = await db.query.categories.findFirst({
    where: (fields, { eq }) => eq(fields.slug, slug),
    columns: { id: true, code: true, slug: true, name: true, emoji: true, image: true },
  });

  const [total] = category
    ? await db
        .select({ value: count() })
        .from(products)
        .where(and(eq(products.categoryId, category.id), eq(products.isActive, true)))
    : [];

  if (!category || !total || total.value === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Categorie niet gevonden.",
    });
  }

  return { ...category, productCount: total.value };
});
