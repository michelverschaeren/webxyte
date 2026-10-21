import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL ontbreekt. Zet hem in .env (lokaal) of in de Environment Variables van de host (productie).",
  );
}

/**
 * Op Vercel draait elke functie-instantie met een eigen pool, en het zijn er
 * meerdere tegelijk: hou de pool daar klein en verbind via de *pooled*
 * Neon-URL (host met `-pooler`). Die pooler (PgBouncer, transaction mode)
 * kent geen prepared statements, vandaar `prepare: false`.
 */
const serverless = Boolean(process.env.VERCEL);

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
    max: serverless ? 3 : 10,
    prepare: !serverless,
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
