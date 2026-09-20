import "dotenv/config";
import { mkdirSync, readFileSync, readdirSync, copyFileSync } from "node:fs";
import { extname, join } from "node:path";
import { sql as sqlOp } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { categories, products } from "./schema";
import { productDocsDir } from "../utils/docs-dir";

/**
 * Eenmalige import van de oorspronkelijke productdata (voor de scrape) uit
 * old-data/. Bron: categories.sql en commerce_products.sql (WooCommerce
 * exports). Kopieert ook categoriefoto's en product-pdf's uit old-data/uploads
 * naar public/ (foto's) en de docs-map (pdf's, zie server/utils/docs-dir.ts), en linkt ze in de DB.
 *
 *   npx tsx server/database/import-legacy.ts
 */
const OLD_DATA = join(process.cwd(), "old-data");
const UPLOADS = join(OLD_DATA, "uploads");
const IGNORED_UPLOAD_DIRS = new Set(["bfi_thumb", "mk_assets", "redux", "wp-file-manager-pro"]);

const CATEGORY_IMAGES_DIR = join(process.cwd(), "public", "images", "categorie");
const PRODUCT_DOCS_DIR = productDocsDir();

// Slugs/emoji zijn niet aanwezig in de SQL-dump — hergebruik de bestaande
// keuzes uit app/data/categories.ts en vul aan voor de 3 nieuwe codes.
const CATEGORY_META: Record<string, { slug: string; emoji: string }> = {
  "10": { slug: "salamis", emoji: "🧄" },
  "15": { slug: "hespen", emoji: "🐷" },
  "20": { slug: "worstwaren", emoji: "🌭" },
  "25": { slug: "kookwaren", emoji: "🍳" },
  "30": { slug: "zoutwaren", emoji: "🧂" },
  "35": { slug: "rookwaren", emoji: "💨" },
  "40": { slug: "pates", emoji: "🫙" },
  "45": { slug: "gevogelte", emoji: "🍗" },
  "50": { slug: "salades", emoji: "🥗" },
  "55": { slug: "traiteur", emoji: "🍱" },
  "60": { slug: "kazen", emoji: "🧀" },
  "65": { slug: "conserven", emoji: "🥫" },
  "68": { slug: "kazen-68", emoji: "🧀" },
  "70": { slug: "drank", emoji: "🥤" },
  "73": { slug: "verpakking", emoji: "📦" },
  "74": { slug: "allerlei-74", emoji: "🛒" },
  "75": { slug: "allerlei", emoji: "🛒" },
  "80": { slug: "soepen", emoji: "🍵" },
  "82": { slug: "kruiden", emoji: "🌿" },
  "84": { slug: "slizing", emoji: "🔪" },
  "85": { slug: "diepvries", emoji: "❄️" },
  "90": { slug: "sauzen", emoji: "🫙" },
  "95": { slug: "tapas", emoji: "🫒" },
  "98": { slug: "verse-bereidingen", emoji: "🥩" },
};

// ---------- MySQL-dump tuple parser ----------
// De dump escaped sommige tekst dubbel (addslashes toegepast op reeds
// geëscapete data, een bekend WordPress-euvel). cleanup() strijkt de
// overgebleven backslash voor een quote glad na het parsen.
function parseTuple(line: string): (string | null)[] {
  let s = line.trim();
  s = s.replace(/^\(/, "").replace(/\),?$/, "");
  const fields: (string | null)[] = [];
  let i = 0;
  while (i < s.length) {
    while (s[i] === " ") i++;
    if (s[i] === "'") {
      i++;
      let buf = "";
      while (i < s.length && s[i] !== "'") {
        if (s[i] === "\\" && i + 1 < s.length) {
          buf += s[i + 1];
          i += 2;
        } else {
          buf += s[i];
          i++;
        }
      }
      i++;
      fields.push(cleanup(buf));
      while (s[i] === " ") i++;
      if (s[i] === ",") i++;
    } else {
      const start = i;
      while (i < s.length && s[i] !== ",") i++;
      const raw = s.slice(start, i).trim();
      fields.push(raw === "NULL" ? null : raw);
      if (s[i] === ",") i++;
    }
  }
  return fields;
}

function cleanup(str: string): string {
  return str
    .replace(/\\+(['"])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Uploads-index ----------
function indexUploads(dir: string, index: Map<string, string>) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_UPLOAD_DIRS.has(entry.name)) continue;
      indexUploads(join(dir, entry.name), index);
    } else {
      index.set(entry.name.toLowerCase(), join(dir, entry.name));
    }
  }
}

function basenameFromUrl(url: string): string {
  return decodeURIComponent(url.split("/").pop() ?? "");
}

async function main() {
  console.log("Uploads indexeren...");
  const uploadsIndex = new Map<string, string>();
  indexUploads(UPLOADS, uploadsIndex);
  console.log(`  ${uploadsIndex.size} bestanden geïndexeerd.`);

  mkdirSync(CATEGORY_IMAGES_DIR, { recursive: true });
  mkdirSync(PRODUCT_DOCS_DIR, { recursive: true });

  // ---------- Categorieën ----------
  const catTxt = readFileSync(join(OLD_DATA, "categories.sql"), "utf8");
  const catLines = catTxt.split("\n").filter((l) => /^\('/.test(l.trim()));
  const parsedCategories = catLines.map((l) => {
    const [code, name, , image] = parseTuple(l);
    return { code: code!, name: name!, imageUrl: image || null };
  });

  console.log(`\nCategorieën: ${parsedCategories.length}`);

  let catImagesCopied = 0;
  let catImagesMissing = 0;

  const categoryRows = parsedCategories.map((cat, index) => {
    const meta = CATEGORY_META[cat.code];
    if (!meta) {
      throw new Error(`Geen slug/emoji bekend voor categoriecode ${cat.code} (${cat.name})`);
    }

    let localImage: string | null = null;
    if (cat.imageUrl) {
      const basename = basenameFromUrl(cat.imageUrl);
      const source = uploadsIndex.get(basename.toLowerCase());
      if (source) {
        const ext = extname(basename);
        const destName = `${meta.slug}${ext}`;
        copyFileSync(source, join(CATEGORY_IMAGES_DIR, destName));
        localImage = `/images/categorie/${destName}`;
        catImagesCopied++;
      } else {
        console.warn(`  ! categoriefoto niet gevonden: ${basename} (${cat.name})`);
        catImagesMissing++;
      }
    }

    return {
      code: cat.code,
      slug: meta.slug,
      name: cat.name,
      emoji: meta.emoji,
      image: localImage,
      sortOrder: index,
    };
  });

  console.log(`  Foto's gekopieerd: ${catImagesCopied}, ontbrekend: ${catImagesMissing}`);

  const insertedCategories = await db
    .insert(categories)
    .values(categoryRows)
    .onConflictDoUpdate({
      target: categories.code,
      set: {
        slug: sqlOp`excluded.slug`,
        name: sqlOp`excluded.name`,
        emoji: sqlOp`excluded.emoji`,
        image: sqlOp`excluded.image`,
        sortOrder: sqlOp`excluded.sort_order`,
      },
    })
    .returning({ id: categories.id, code: categories.code });

  const categoryIdByCode = new Map(insertedCategories.map((c) => [c.code, c.id]));

  // ---------- Producten ----------
  const prodTxt = readFileSync(join(OLD_DATA, "commerce_products.sql"), "utf8");
  const prodLines = prodTxt.split("\n").filter((l) => /^\(\d+,/.test(l));
  console.log(`\nProductrijen in dump: ${prodLines.length}`);

  let pdfsCopied = 0;
  let pdfsMissing = 0;
  let skippedNoCategory = 0;

  const productRows: (typeof products.$inferInsert)[] = [];

  for (const line of prodLines) {
    const [
      ,
      productcode,
      ,
      categoryCode,
      description,
      unit,
      manufacturer,
      ,
      pdf,
      deletedAt,
    ] = parseTuple(line);

    const categoryId = categoryCode ? categoryIdByCode.get(categoryCode) : undefined;
    if (!categoryId) {
      skippedNoCategory++;
      continue;
    }

    let localPdf: string | null = null;
    if (pdf) {
      const basename = basenameFromUrl(pdf);
      const source = uploadsIndex.get(basename.toLowerCase());
      if (source) {
        const ext = extname(basename) || ".pdf";
        const destName = `${productcode}${ext}`;
        copyFileSync(source, join(PRODUCT_DOCS_DIR, destName));
        localPdf = `/docs/products/${destName}`;
        pdfsCopied++;
      } else {
        console.warn(`  ! pdf niet gevonden: ${basename} (${productcode})`);
        pdfsMissing++;
      }
    }

    productRows.push({
      articleNr: productcode!,
      name: description!,
      supplier: manufacturer!,
      categoryId,
      unit: unit || null,
      infoPdf: localPdf,
      isActive: deletedAt === null,
    });
  }

  console.log(`  Overgeslagen (onbekende/lege categoriecode): ${skippedNoCategory}`);
  console.log(`  Pdf's gekopieerd: ${pdfsCopied}, ontbrekend: ${pdfsMissing}`);
  console.log(`  Te importeren producten: ${productRows.length}`);

  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < productRows.length; i += BATCH) {
    const batch = productRows.slice(i, i + BATCH);
    await db
      .insert(products)
      .values(batch)
      .onConflictDoUpdate({
        target: products.articleNr,
        set: {
          name: sqlOp`excluded.name`,
          supplier: sqlOp`excluded.supplier`,
          categoryId: sqlOp`excluded.category_id`,
          unit: sqlOp`excluded.unit`,
          infoPdf: sqlOp`excluded.info_pdf`,
          isActive: sqlOp`excluded.is_active`,
        },
      });
    upserted += batch.length;
    console.log(`  ...${upserted}/${productRows.length}`);
  }

  console.log("\nKlaar.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
