import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { inArray } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { categories, products } from "./schema";

/**
 * Eenmalige opkuis: categorieën 68 ("Kazen", duplicaat van 60), 74
 * ("Allerlei", duplicaat van 75) en 82 ("Kruiden") zijn niet meer in gebruik.
 * Verwijdert hun producten en daarna de categorieën zelf.
 *
 *   npx tsx server/database/drop-categories.ts            (dry run, geen writes)
 *   npx tsx server/database/drop-categories.ts --apply     (voert het echt uit)
 */
const TARGET_CODES = ["68", "74", "82"];
const APPLY = process.argv.includes("--apply");
const REPORT_PATH = join(process.cwd(), "old-data", "drop-categories-report.json");

async function main() {
  const targetCategories = await db
    .select({ id: categories.id, code: categories.code, name: categories.name })
    .from(categories)
    .where(inArray(categories.code, TARGET_CODES));

  if (targetCategories.length === 0) {
    console.log("Geen van de opgegeven categoriecodes gevonden — niets te doen.");
    return;
  }

  const categoryIds = targetCategories.map((c) => c.id);
  const affectedProducts = await db
    .select({ articleNr: products.articleNr, name: products.name, categoryId: products.categoryId })
    .from(products)
    .where(inArray(products.categoryId, categoryIds));

  console.log(`Categorieën om te droppen: ${targetCategories.length}`);
  for (const c of targetCategories) {
    const n = affectedProducts.filter((p) => p.categoryId === c.id).length;
    console.log(`  ${c.code} — ${c.name}: ${n} product(en)`);
  }
  console.log(`\nTotaal te verwijderen producten: ${affectedProducts.length}`);
  for (const p of affectedProducts) {
    console.log(`  ${p.articleNr}\t${p.name}`);
  }

  const categoryCodeById = new Map(targetCategories.map((c) => [c.id, c.code]));
  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        categories: targetCategories.map((c) => ({
          code: c.code,
          name: c.name,
          productCount: affectedProducts.filter((p) => p.categoryId === c.id).length,
        })),
        products: affectedProducts.map((p) => ({
          articleNr: p.articleNr,
          name: p.name,
          categoryCode: categoryCodeById.get(p.categoryId),
        })),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\nVolledig rapport: ${REPORT_PATH}`);

  if (!APPLY) {
    console.log("\nDry run — niets gewijzigd. Voeg --apply toe om dit uit te voeren.");
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(products).where(inArray(products.categoryId, categoryIds));
    await tx.delete(categories).where(inArray(categories.code, TARGET_CODES));
  });
  console.log(
    `\nKlaar: ${affectedProducts.length} product(en) en ${targetCategories.length} categorie(ën) verwijderd.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
