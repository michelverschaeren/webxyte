import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import { defineConfig } from "drizzle-kit";
import base from "./drizzle.config";

/**
 * Zelfde config als drizzle.config.ts, maar tegen de Neon-productiebranch,
 * met DATABASE_URL uit `.env.live` (niet uit `.env`, dat naar de branch
 * "development" wijst). Enkel voor `npm run db:migrate:production`, bewust
 * en na akkoord (zie skill db-migration).
 */
if (!existsSync(".env.live")) {
  throw new Error(".env.live ontbreekt: daar staan de productiewaarden.");
}
const live = parse(readFileSync(".env.live"));
if (!live.DATABASE_URL) {
  throw new Error("DATABASE_URL ontbreekt in .env.live.");
}

export default defineConfig({
  ...base,
  dbCredentials: { url: live.DATABASE_URL },
});
