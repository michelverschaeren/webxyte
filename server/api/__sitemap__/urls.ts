import { and, eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { categories, products } from "~~/server/database/schema";

/**
 * Sitemap-bron voor de dynamische pagina's: elke categorie met actieve
 * producten. Wordt door @nuxtjs/sitemap opgehaald (zie `sitemap.sources` in
 * nuxt.config.ts) en met de statische pagina's samengevoegd in /sitemap.xml.
 * Producten staan er bewust niet in — die zijn niet publiek.
 */
export default defineEventHandler(async () => {
  const rows = await db
    .selectDistinct({ slug: categories.slug })
    .from(categories)
    .innerJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true)),
    );

  return rows.map((c) => ({ loc: `/assortiment/${c.slug}` }));
});
