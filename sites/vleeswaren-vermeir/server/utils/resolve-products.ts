import { inArray } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { products, type Product } from "~~/server/database/schema";

/**
 * Vertaalt client-aangeleverde artikelnummers naar echte productrijen.
 * De client mag nooit een database-id meesturen (die kan verzonnen of
 * verouderd zijn) — enkel `articleNr`, de natuurlijke sleutel, telt.
 */
export async function resolveProductsByArticleNr(
  articleNrs: string[],
): Promise<Map<string, Product>> {
  if (articleNrs.length === 0) return new Map();

  const found = await db
    .select()
    .from(products)
    .where(inArray(products.articleNr, articleNrs));

  return new Map(found.map((p) => [p.articleNr, p]));
}
