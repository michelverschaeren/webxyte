import { basename } from "node:path";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { deleteProductDoc } from "~~/server/utils/product-docs";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * DELETE /api/admin/products/:id/pdf — koppelt de productfiche los en
 * verwijdert het bestand uit de fiche-opslag.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const [product] = await db
    .select({ infoPdf: products.infoPdf })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  // `infoPdf` kan ook een externe URL zijn; alleen onze eigen bestanden
  // (/docs/products/<naam>.pdf) staan in de fiche-opslag.
  if (product.infoPdf?.startsWith("/docs/products/")) {
    await deleteProductDoc(basename(product.infoPdf));
  }

  const [updated] = await db
    .update(products)
    .set({ infoPdf: null })
    .where(eq(products.id, id))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  return { ...updated, price: updated.price ? Number(updated.price) : null };
});
