import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ontbreekt. Kopieer .env.example naar .env.");
}

/**
 * Config voor de Drizzle Kit CLI (migraties, studio, introspectie).
 * Draait alléén lokaal op jouw machine — nooit mee in de productie-bundle.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./server/database/schema/index.ts",
  out: "./server/database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Schrijf kolommen in TypeScript als camelCase, in Postgres als snake_case.
  // Moet identiek zijn aan de `casing` van de drizzle()-client.
  casing: "snake_case",
  verbose: true,
  strict: true,
});
