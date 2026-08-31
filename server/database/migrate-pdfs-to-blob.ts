import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { eq, like } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { products } from "./schema";

/**
 * Eenmalige migratie van de productfiches naar Vercel Blob.
 *
 * Tot de overstap naar Vercel stonden de pdf's als bestand in public/docs/
 * products/ en bevatte `products.info_pdf` een pad. Op Vercel is dat pad niet
 * schrijfbaar en groeit de deploy met elke fiche mee, dus verhuizen ze naar
 * Blob en bewaart de kolom voortaan de volledige URL.
 *
 * Draai lokaal, met de bestanden nog in public/ en met BLOB_READ_WRITE_TOKEN
 * en DATABASE_URL (de directe, niet-gepoolde Neon-URL) in .env:
 *
 *   npx tsx server/database/migrate-pdfs-to-blob.ts
 *
 * Het script is idempotent: rijen die al een http-URL dragen worden
 * overgeslagen, dus je kunt het na een onderbreking gewoon opnieuw starten.
 */
const PUBLIC_DIR = join(process.cwd(), "public");

// Blob-uploads zijn netwerk-gebonden; een handvol parallel scheelt uren op
// ~900 bestanden, maar te veel tegelijk levert rate limits op.
const CONCURRENCY = 8;

async function migrateOne(row: { id: string; infoPdf: string }) {
  const data = await readFile(join(PUBLIC_DIR, row.infoPdf));

  // Zelfde sleutel als pdf.post.ts schrijft, zodat een latere vervanging via
  // de admin de gemigreerde blob overschrijft in plaats van te dupliceren.
  const key = `docs/products/${row.infoPdf.split("/").pop()}`;

  const blob = await put(key, data, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  await db
    .update(products)
    .set({ infoPdf: blob.url })
    .where(eq(products.id, row.id));
}

async function main() {
  const rows = await db
    .select({ id: products.id, infoPdf: products.infoPdf })
    .from(products)
    .where(like(products.infoPdf, "/docs/%"));

  console.log(`Te migreren fiches: ${rows.length}`);

  let done = 0;
  let failed = 0;
  const queue = [...rows] as { id: string; infoPdf: string }[];

  async function worker() {
    for (let row = queue.shift(); row; row = queue.shift()) {
      try {
        await migrateOne(row);
        done++;
        if (done % 25 === 0) console.log(`  ...${done}/${rows.length}`);
      } catch (error) {
        failed++;
        console.warn(`  ! ${row.infoPdf}: ${(error as Error).message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
  );

  console.log(`\nKlaar. Gemigreerd: ${done}, mislukt: ${failed}.`);
  if (failed > 0) {
    console.log("Draai het script opnieuw om de mislukte fiches te hernemen.");
  }

  await connection.end();
}

main().catch(async (error) => {
  console.error(error);
  await connection.end();
  process.exit(1);
});
