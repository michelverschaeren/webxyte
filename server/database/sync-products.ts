import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, notInArray } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { categories, products } from "./schema";

/**
 * Synchroniseert de productcatalogus met een verse export uit het
 * bestelsysteem (old-data/producten-2026.csv). Matcht op articleNr (Nr.).
 * Categoriecode komt uit "Voorraadboekingsgroep" — die kolom komt exact
 * overeen met categories.code. Prijs en eenheid staan niet in deze export
 * en worden dus NOOIT overschreven, ook niet bij bestaande producten.
 * "LG"-rijen (Retour LG, Kort.) zijn boekhoudkundige codes, geen producten.
 *
 *   npx tsx server/database/sync-products.ts             (dry run, schrijft rapport)
 *   npx tsx server/database/sync-products.ts --apply      (voert het echt uit)
 */
const CSV_PATH = join(process.cwd(), "old-data", "producten-2026.csv");
const REPORT_PATH = join(process.cwd(), "old-data", "sync-report.json");
const APPLY = process.argv.includes("--apply");
const NON_PRODUCT_GROUPS = new Set(["LG"]);

type CsvRow = { articleNr: string; name: string; supplier: string; groupCode: string };

/**
 * E\u00E9n CSV-regel (scheidingsteken `;`) in velden. Velden tussen aanhalingstekens
 * mogen `;` bevatten en `""` staat voor \u00E9\u00E9n `"`: `"Boulogne ""Kilo"""` \u2192
 * `Boulogne "Kilo"`.
 */
function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (ch === ";") {
      cols.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  cols.push(field);
  return cols;
}

function parseCsv(): CsvRow[] {
  const text = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const [articleNr, name, , supplier, , , , groupCode] = cols;
    if (!articleNr) continue;
    rows.push({
      articleNr: articleNr.trim(),
      name: (name ?? "").trim(),
      supplier: (supplier ?? "").trim(),
      groupCode: (groupCode ?? "").trim(),
    });
  }
  return rows;
}

async function main() {
  const allRows = parseCsv();
  const rows = allRows.filter((r) => !NON_PRODUCT_GROUPS.has(r.groupCode));
  console.log(`CSV-rijen: ${allRows.length} (${allRows.length - rows.length} niet-productcodes overgeslagen)`);

  const dbCategories = await db
    .select({ id: categories.id, code: categories.code })
    .from(categories);
  const categoryIdByCode = new Map(dbCategories.map((c) => [c.code, c.id]));

  const dbProducts = await db
    .select({
      id: products.id,
      articleNr: products.articleNr,
      name: products.name,
      supplier: products.supplier,
      categoryId: products.categoryId,
      isActive: products.isActive,
    })
    .from(products);
  const dbProductByArticleNr = new Map(dbProducts.map((p) => [p.articleNr, p]));

  const presentArticleNrs = new Set(rows.map((r) => r.articleNr));

  const toInsert: (typeof products.$inferInsert)[] = [];
  const toUpdate: {
    articleNr: string;
    changes: Partial<{ name: string; supplier: string; categoryId: string; isActive: boolean }>;
  }[] = [];
  const unresolved: { articleNr: string; name: string; groupCode: string; reason: string }[] = [];

  for (const row of rows) {
    const existing = dbProductByArticleNr.get(row.articleNr);

    let categoryId: string | undefined;
    if (row.groupCode) {
      categoryId = categoryIdByCode.get(row.groupCode);
      if (!categoryId) {
        unresolved.push({
          articleNr: row.articleNr,
          name: row.name,
          groupCode: row.groupCode,
          reason: `onbekende categoriecode "${row.groupCode}"`,
        });
        continue;
      }
    } else if (existing) {
      categoryId = existing.categoryId;
    } else {
      unresolved.push({
        articleNr: row.articleNr,
        name: row.name,
        groupCode: row.groupCode,
        reason: "geen categoriecode en nog niet in DB (nieuw product zonder groep)",
      });
      continue;
    }

    if (!existing) {
      toInsert.push({
        articleNr: row.articleNr,
        name: row.name,
        supplier: row.supplier,
        categoryId,
        isActive: true,
      });
      continue;
    }

    const changes: (typeof toUpdate)[number]["changes"] = {};
    if (existing.name !== row.name) changes.name = row.name;
    if (existing.supplier !== row.supplier) changes.supplier = row.supplier;
    if (existing.categoryId !== categoryId) changes.categoryId = categoryId;
    if (!existing.isActive) changes.isActive = true;
    if (Object.keys(changes).length > 0) {
      toUpdate.push({ articleNr: row.articleNr, changes });
    }
  }

  const toDisable = dbProducts.filter((p) => p.isActive && !presentArticleNrs.has(p.articleNr));

  const categoryById = new Map(dbCategories.map((c) => [c.id, c]));
  const codeOf = (id: string) => categoryById.get(id)?.code ?? id;

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      csvRows: rows.length,
      toInsert: toInsert.length,
      toUpdate: toUpdate.length,
      toDisable: toDisable.length,
      unresolved: unresolved.length,
    },
    toInsert: toInsert.map((p) => ({
      articleNr: p.articleNr,
      name: p.name,
      supplier: p.supplier,
      categoryCode: codeOf(p.categoryId as string),
    })),
    toUpdate: toUpdate.map(({ articleNr, changes }) => {
      const existing = dbProductByArticleNr.get(articleNr)!;
      const fields: Record<string, { from: string; to: string }> = {};
      if (changes.name !== undefined) fields.name = { from: existing.name, to: changes.name };
      if (changes.supplier !== undefined)
        fields.supplier = { from: existing.supplier, to: changes.supplier };
      if (changes.categoryId !== undefined)
        fields.category = { from: codeOf(existing.categoryId), to: codeOf(changes.categoryId) };
      if (changes.isActive !== undefined) fields.isActive = { from: "false", to: "true" };
      return { articleNr, name: changes.name ?? existing.name, fields };
    }),
    toDisable: toDisable.map((p) => ({
      articleNr: p.articleNr,
      name: p.name,
      categoryCode: codeOf(p.categoryId),
    })),
    unresolved,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`\nNieuw toe te voegen:   ${toInsert.length}`);
  console.log(`Te updaten:            ${toUpdate.length} (naam/leverancier/categorie of heractiveren)`);
  console.log(`Uit te schakelen:      ${toDisable.length} (actief in DB, niet meer in CSV)`);
  console.log(`Onopgelost:            ${unresolved.length} (overgeslagen — zie rapport)`);
  console.log(`\nVolledig rapport: ${REPORT_PATH}`);

  if (!APPLY) {
    console.log("\nDry run — niets gewijzigd. Voeg --apply toe om dit uit te voeren.");
    return;
  }

  await db.transaction(async (tx) => {
    if (toInsert.length > 0) {
      const BATCH = 500;
      for (let i = 0; i < toInsert.length; i += BATCH) {
        await tx.insert(products).values(toInsert.slice(i, i + BATCH));
      }
    }
    for (const { articleNr, changes } of toUpdate) {
      await tx.update(products).set(changes).where(eq(products.articleNr, articleNr));
    }
    if (presentArticleNrs.size > 0) {
      await tx
        .update(products)
        .set({ isActive: false })
        .where(and(eq(products.isActive, true), notInArray(products.articleNr, [...presentArticleNrs])));
    }
  });

  console.log(
    `\nKlaar: ${toInsert.length} toegevoegd, ${toUpdate.length} geüpdatet, ${toDisable.length} uitgeschakeld.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
