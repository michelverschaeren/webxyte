import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql as sqlOp } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { customerPurchaseHistory, customers, products } from "./schema";

/**
 * Import van klanten + aankoophistoriek uit de CRM-export
 * old-data/klanten/Klanten-Vermeir.csv.
 *
 * Die export bevat één rij per klant × artikel met de datum van de laatste
 * aankoop — geen afzonderlijke bestellingen. Daarom landt ze in
 * `customer_purchase_history` en niet in `orders`.
 *
 * Klanten krijgen een voorlopige naam ("Klant 100145"). Bestaande klanten
 * worden nooit overschreven, zodat een latere update met echte namen en
 * contactgegevens bij een herhaalde import blijft staan.
 *
 *   npx tsx server/database/import-customers.ts --dry-run
 *   npx tsx server/database/import-customers.ts
 */
const CSV = join(process.cwd(), "old-data", "klanten", "Klanten-Vermeir.csv");
const REPORT = join(process.cwd(), "old-data", "import-customers-report.json");
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 500;

/** Omschrijvingen die op een correctie wijzen i.p.v. een verkocht artikel. */
const CORRECTION_PATTERN = /korting|rechtzetting/i;

// De export is Windows-1252; velden met ; of " staan tussen quotes.
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ";") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/** "4/06/2026" → "2026-06-04" */
function toIsoDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
}

async function main() {
  const lines = readFileSync(CSV, "latin1").split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1).map(splitCsvLine);
  console.log(`CSV-rijen: ${rows.length}${DRY_RUN ? "  (DRY RUN — er wordt niets geschreven)" : ""}`);

  const articleIds = new Map(
    (await db.select({ id: products.id, articleNr: products.articleNr }).from(products)).map(
      (p) => [p.articleNr, p.id],
    ),
  );

  const customerNrs = new Set<string>();
  // klantnr → productId → laatste aankoopdatum
  const history = new Map<string, Map<string, string>>();
  const skipped = {
    notAnArticle: [] as string[],
    correction: [] as string[],
    unknownArticle: [] as string[],
    invalidRow: [] as string[],
  };

  for (const [index, row] of rows.entries()) {
    const [customerNr = "", rawDate = "", , articleNr = "", description = ""] = row;
    const ref = `rij ${index + 2}: ${customerNr} / ${articleNr} ${description}`.trim();
    const date = toIsoDate(rawDate);

    if (!/^\d+$/.test(customerNr) || !date) {
      skipped.invalidRow.push(ref);
      continue;
    }
    customerNrs.add(customerNr);

    if (!/^\d+$/.test(articleNr)) {
      skipped.notAnArticle.push(ref);
      continue;
    }
    if (CORRECTION_PATTERN.test(description)) {
      skipped.correction.push(ref);
      continue;
    }
    const productId = articleIds.get(articleNr);
    if (!productId) {
      skipped.unknownArticle.push(ref);
      continue;
    }

    const perCustomer = history.get(customerNr) ?? new Map<string, string>();
    const known = perCustomer.get(productId);
    if (!known || date > known) perCustomer.set(productId, date);
    history.set(customerNr, perCustomer);
  }

  const historyCount = [...history.values()].reduce((sum, m) => sum + m.size, 0);
  console.log(`Klanten: ${customerNrs.size}`);
  console.log(`Historiekregels: ${historyCount}`);
  console.log(
    `Overgeslagen: ${skipped.notAnArticle.length} geen artikel, ${skipped.correction.length} correctie, ` +
      `${skipped.unknownArticle.length} onbekend artikel, ${skipped.invalidRow.length} ongeldig`,
  );

  let customersInserted = 0;
  let historyUpserted = 0;

  if (!DRY_RUN) {
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(customers)
        .values([...customerNrs].sort().map((nr) => ({ customerNr: nr, name: `Klant ${nr}` })))
        .onConflictDoNothing({ target: customers.customerNr })
        .returning({ id: customers.id });
      customersInserted = inserted.length;

      const customerIds = new Map(
        (await tx.select({ id: customers.id, customerNr: customers.customerNr }).from(customers)).map(
          (c) => [c.customerNr, c.id],
        ),
      );

      const historyRows = [...history].flatMap(([customerNr, perCustomer]) =>
        [...perCustomer].map(([productId, lastPurchasedAt]) => ({
          customerId: customerIds.get(customerNr)!,
          productId,
          lastPurchasedAt,
        })),
      );

      for (let i = 0; i < historyRows.length; i += BATCH) {
        await tx
          .insert(customerPurchaseHistory)
          .values(historyRows.slice(i, i + BATCH))
          .onConflictDoUpdate({
            target: [customerPurchaseHistory.customerId, customerPurchaseHistory.productId],
            // Een oudere export mag een recentere datum nooit terugzetten.
            set: {
              lastPurchasedAt: sqlOp`greatest(${customerPurchaseHistory.lastPurchasedAt}, excluded.last_purchased_at)`,
            },
          });
        historyUpserted += Math.min(BATCH, historyRows.length - i);
      }
    });
    console.log(`\nNieuwe klanten: ${customersInserted} (bestaande blijven ongewijzigd)`);
    console.log(`Historiekregels geschreven: ${historyUpserted}`);
  }

  writeFileSync(
    REPORT,
    JSON.stringify(
      {
        source: "old-data/klanten/Klanten-Vermeir.csv",
        dryRun: DRY_RUN,
        csvRows: rows.length,
        customers: customerNrs.size,
        customersInserted,
        historyRows: historyCount,
        historyUpserted,
        skipped,
      },
      null,
      2,
    ),
  );
  console.log(`Rapport: ${REPORT}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
