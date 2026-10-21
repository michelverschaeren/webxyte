import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { customers } from "./schema";

/**
 * Vult naam + contactmail van bestaande klanten aan uit de CRM-klantenlijst
 * old-data/klanten/Klanten-4.csv. Maakt geen klanten aan: enkel
 * klantnummers die al in `customers` staan worden bijgewerkt.
 *
 * Eén e-mailadres hoort bij één klant (het is ook de login). Een adres dat
 * al bij een andere klant staat, wordt niet overgenomen en komt in het
 * rapport onder `emailConflicts`. Klanten met een login houden hun adres.
 *
 *   npx tsx server/database/update-customer-names.ts --dry-run
 *   npx tsx server/database/update-customer-names.ts
 */
const CSV = join(process.cwd(), "old-data", "klanten", "Klanten-4.csv");
const REPORT = join(process.cwd(), "old-data", "update-customer-names-report.json");
const DRY_RUN = process.argv.includes("--dry-run");

// Deze export is in DOS-codepagina 850 opgeslagen, niet in Windows-1252.
const CP850: Record<number, string> = {
  0x81: "ü", 0x82: "é", 0x83: "â", 0x84: "ä", 0x85: "à", 0x87: "ç", 0x88: "ê",
  0x89: "ë", 0x8a: "è", 0x8b: "ï", 0x8c: "î", 0x93: "ô", 0x94: "ö", 0x96: "û",
};

function decodeCp850(buffer: Buffer): string {
  let out = "";
  for (const byte of buffer) out += byte < 0x80 ? String.fromCharCode(byte) : (CP850[byte] ?? "?");
  return out;
}

/** Quotes in namen zijn in de export kapot geëscaped — laat ze weg. */
function cleanName(raw: string): string {
  return raw.replace(/"/g, "").replace(/\s+/g, " ").trim();
}

/** Haalt een geldig adres uit rommel als "Steve Dekker [x@y.be]"; anders null. */
function cleanEmail(raw: string): string | null {
  const candidate = raw.match(/[^\s[\]<>()"]+@[^\s[\]<>()"]+/)?.[0]?.toLowerCase();
  return candidate && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(candidate) ? candidate : null;
}

async function main() {
  const records = decodeCp850(readFileSync(CSV))
    .split(/\r?\n/)
    .map((line) => line.match(/^"(\d+)";"(.*)";"(.*)"$/))
    .filter((match) => match !== null)
    .map(([, customerNr, name, email]) => ({
      customerNr: customerNr!,
      name: cleanName(name!),
      rawEmail: email!.trim(),
      contactEmail: cleanEmail(email!),
    }));

  const existing = new Map(
    (
      await db
        .select({
          customerNr: customers.customerNr,
          name: customers.name,
          contactEmail: customers.contactEmail,
          userId: customers.userId,
        })
        .from(customers)
    ).map((c) => [c.customerNr, c]),
  );

  const matched = records.filter((r) => existing.has(r.customerNr) && r.name);
  const invalidEmails = matched
    .filter((r) => r.rawEmail && !r.contactEmail)
    .map((r) => ({ customerNr: r.customerNr, value: r.rawEmail }));
  const withoutName = [...existing.keys()].filter((nr) => !matched.some((r) => r.customerNr === nr)).sort();

  // Wie houdt welk adres: wat al in de database staat wint (zo blijven de
  // keuzes uit migratie 0009 staan), daarna de CSV in volgorde.
  const emailOwner = new Map<string, string>();
  for (const c of existing.values()) {
    if (c.contactEmail) emailOwner.set(c.contactEmail.toLowerCase(), c.customerNr);
  }
  const emailConflicts: { customerNr: string; email: string; ownedBy: string }[] = [];
  const emailFor = new Map<string, string | null>();
  for (const r of matched) {
    const current = existing.get(r.customerNr)!;
    if (current.userId) {
      emailFor.set(r.customerNr, current.contactEmail);
      continue;
    }
    const owner = r.contactEmail ? emailOwner.get(r.contactEmail) : undefined;
    if (r.contactEmail && owner && owner !== r.customerNr) {
      emailConflicts.push({ customerNr: r.customerNr, email: r.contactEmail, ownedBy: owner });
      emailFor.set(r.customerNr, null);
      continue;
    }
    if (r.contactEmail) emailOwner.set(r.contactEmail, r.customerNr);
    emailFor.set(r.customerNr, r.contactEmail);
  }

  console.log(`Klanten in CSV: ${records.length}${DRY_RUN ? "  (DRY RUN — er wordt niets geschreven)" : ""}`);
  console.log(`Bij te werken: ${matched.length} van ${existing.size}`);
  console.log(`Met contactmail: ${matched.filter((r) => r.contactEmail).length}, ongeldige mail: ${invalidEmails.length}`);
  console.log(`Nog zonder naam: ${withoutName.length}`);
  console.log(`Adres al bij een andere klant (niet overgenomen): ${emailConflicts.length}`);

  if (!DRY_RUN) {
    await db.transaction(async (tx) => {
      for (const r of matched) {
        await tx
          .update(customers)
          .set({ name: r.name, contactEmail: emailFor.get(r.customerNr) ?? null })
          .where(eq(customers.customerNr, r.customerNr));
      }
    });
    console.log(`\nBijgewerkt: ${matched.length}`);
  }

  writeFileSync(
    REPORT,
    JSON.stringify(
      {
        source: "old-data/klanten/Klanten-4.csv",
        dryRun: DRY_RUN,
        updated: matched.map((r) => ({
          customerNr: r.customerNr,
          from: existing.get(r.customerNr)!.name,
          name: r.name,
          contactEmail: emailFor.get(r.customerNr) ?? null,
        })),
        invalidEmails,
        emailConflicts,
        withoutName,
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
