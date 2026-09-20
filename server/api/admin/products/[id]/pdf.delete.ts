import { existsSync, unlinkSync } from "node:fs";
import { basename, join } from "node:path";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { productDocsDir } from "~~/server/utils/docs-dir";
import { requireAdmin } from "~~/server/utils/session";

/**
 * DELETE /api/admin/products/:id/pdf — koppelt de productfiche los en
 * verwijdert het lokale bestand.
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
  // (/docs/products/<naam>.pdf) staan in de docs-map.
  if (product.infoPdf?.startsWith("/docs/products/")) {
    const filePath = join(productDocsDir(), basename(product.infoPdf));
    if (existsSync(filePath)) unlinkSync(filePath);
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
