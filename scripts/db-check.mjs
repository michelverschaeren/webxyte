/**
 * Verbindingstest voor de Postgres-database.
 * Draait los van Nuxt en Drizzle, zodat je kan zien of het probleem bij het
 * netwerk, de credentials of de applicatie zit.
 *
 *   pnpm db:ping
 */
import pg from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL ontbreekt. Kopieer .env.example naar .env.");
  process.exit(1);
}

// Toon waar we verbinden, maar lek het wachtwoord niet in de terminal.
const { hostname, port, pathname, username } = new URL(url);
console.log(`→ ${username}@${hostname}:${port || 5432}${pathname}`);

const sql = pg(url, { connect_timeout: 10, max: 1 });

try {
  const [info] = await sql`select version(), current_database(), current_user`;
  console.log("✓ Verbonden");
  console.log(`  database : ${info.current_database}`);
  console.log(`  gebruiker: ${info.current_user}`);
  console.log(`  server   : ${info.version.split(" on ")[0]}`);

  const tables = await sql`
    select tablename from pg_tables where schemaname = 'public' order by tablename
  `;
  console.log(
    tables.length
      ? `  tabellen : ${tables.map((t) => t.tablename).join(", ")}`
      : "  tabellen : (geen) — draai 'pnpm db:migrate'",
  );
} catch (err) {
  console.error(`✗ Mislukt: ${err.message}`);
  console.error(`  code: ${err.code ?? "onbekend"}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
