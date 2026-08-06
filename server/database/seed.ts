import "dotenv/config";
import { sql } from "drizzle-orm";
import { categories as seedCategories } from "../../app/data/categories";
import { products as seedProducts } from "../../app/data/products";
import { db, sql as connection } from "./client";
import { categories, products } from "./schema";

/**
 * Vult de database met de bestaande hardcoded data uit app/data/.
 * Idempotent: opnieuw draaien werkt bestaande rijen bij i.p.v. te dupliceren.
 * `excluded.*` verwijst in Postgres naar de rij die we probeerden in te voegen.
 *
 *   pnpm db:seed
 */
async function seed() {
  console.log(`Categorieën: ${seedCategories.length}`);

  const insertedCategories = await db
    .insert(categories)
    .values(
      seedCategories.map((category, index) => ({
        code: category.id,
        slug: category.slug,
        name: category.name,
        emoji: category.emoji,
        sortOrder: index,
      })),
    )
    .onConflictDoUpdate({
      target: categories.code,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        emoji: sql`excluded.emoji`,
        sortOrder: sql`excluded.sort_order`,
      },
    })
    .returning({ id: categories.id, code: categories.code });

  // Map de oude tekst-id ("10") naar de nieuwe uuid van de categorie.
  const categoryIdByCode = new Map(
    insertedCategories.map((category) => [category.code, category.id]),
  );

  const rows = seedProducts.flatMap((product) => {
    const categoryId = categoryIdByCode.get(product.categoryId);

    if (!categoryId) {
      console.warn(
        `Product ${product.articleNr} verwijst naar onbekende categorie ${product.categoryId} — overgeslagen.`,
      );
      return [];
    }

    return [
      {
        articleNr: product.articleNr,
        name: product.name,
        supplier: product.supplier,
        categoryId,
        unit: product.unit ?? null,
        infoPdf: product.infoPdf ?? null,
      },
    ];
  });

  console.log(`Producten: ${rows.length}`);

  await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.articleNr,
      set: {
        name: sql`excluded.name`,
        supplier: sql`excluded.supplier`,
        categoryId: sql`excluded.category_id`,
        unit: sql`excluded.unit`,
        infoPdf: sql`excluded.info_pdf`,
        isActive: sql`true`,
      },
    });

  console.log("Klaar.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
