import { join } from "node:path";

/**
 * Map met de productfiches (PDF). Bewust NIET onder public/: alles in public/
 * wordt bij `nuxt build` gekopieerd en met brotli-11 voorgecomprimeerd — bij
 * ~900 PDF's (250 MB) kostte dat zo'n 8 minuten bouwtijd, en wat na de build
 * via de admin wordt geüpload zou er nooit in zitten.
 *
 * De bestanden worden geserveerd door server/routes/docs/products/[file].get.ts
 * onder dezelfde URL als voorheen (/docs/products/<artikelnr>.pdf), dus de
 * `infoPdf`-waarden in de database blijven kloppen.
 *
 * In productie: koppel er een Dokploy-volume aan en zet `DOCS_DIR` op het
 * mountpad (zie README, hoofdstuk 7). Zonder `DOCS_DIR` gebruikt de app
 * `<project>/data/docs` — handig lokaal, maar in een container verdwijnen
 * uploads dan bij de volgende deploy.
 *
 * Geen Nuxt/Nitro-imports: ook het importscript (tsx) gebruikt dit bestand.
 */
export function productDocsDir(): string {
  const root = process.env.DOCS_DIR || join(process.cwd(), "data", "docs");
  return join(root, "products");
}
