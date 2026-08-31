import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * DELETE /api/admin/products/:id/pdf — koppelt de productfiche los en
 * verwijdert de blob.
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

  // Rijen van vóór de blob-migratie dragen nog een pad als "/docs/products/…";
  // daar hoort geen blob bij, dus enkel echte URL's doorgeven aan del().
  if (product.infoPdf?.startsWith("http")) {
    // Een al verwijderde blob is geen fout voor de gebruiker: de bedoeling
    // (geen fiche meer aan dit product) wordt hieronder sowieso bereikt.
    await del(product.infoPdf).catch((error) => {
      console.error(`Blob verwijderen mislukt voor product ${id}:`, error);
    });
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
