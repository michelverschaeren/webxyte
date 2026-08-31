import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL ontbreekt. Zet hem in .env (lokaal) of in de Environment-tab van Dokploy (productie).",
  );
}

/**
 * De Nitro dev-server herlaadt modules bij elke wijziging. Zonder deze cache
 * bouwt elke herlaad een nieuwe connection pool op tot Postgres "too many
 * clients" geeft. In productie draait dit blok exact één keer.
 */
const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__sql ??
  postgres(connectionString, {
    // Neon's pooler is PgBouncer in transaction mode: de serverconnectie gaat
    // na elke transactie terug in de pool, dus een named prepared statement
    // van de vorige request bestaat er niet meer ("prepared statement s1
    // already exists" / "does not exist"). Uitzetten kost wat planning-tijd
    // maar is de enige veilige stand achter een transaction pooler.
    prepare: false,
    // Vercel houdt met Fluid compute instances warm, dus de pool wordt wél
    // hergebruikt — maar er draaien er veel naast elkaar. Klein houden en de
    // pooler het multiplexen laten doen; 1 zou de concurrency binnen één
    // instance onnodig serialiseren.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sql = sql;
}

/**
 * De type-safe database-client. Importeer deze overal:
 *   import { db } from "~~/server/database/client";
 *
 * Dankzij `schema` werkt zowel de query-builder (`db.select()`) als de
 * relationele API (`db.query.products.findMany({ with: { category: true } })`).
 */
export const db = drizzle(sql, {
  schema,
  casing: "snake_case",
  logger: process.env.NODE_ENV !== "production",
});

export { schema, sql };
export type Database = typeof db;
