import { and, asc, count, eq } from "drizzle-orm";
import { getSiteConfig } from "#site-config/server/composables";
import { getSiteIndexable } from "#site-config/server/composables/getSiteIndexable";
import { COMPANY, FAQ } from "#shared/company";
import { db } from "~~/server/database/client";
import { categories, products } from "~~/server/database/schema";

/**
 * GET /llms.txt
 * Beknopte, machineleesbare samenvatting van de site voor AI-assistenten en
 * -zoekmachines (https://llmstxt.org). De categorielijst komt live uit de
 * database, zodat ze nooit achterloopt op het assortiment.
 *
 * Volgt dezelfde schakelaar als robots.txt: is de site niet indexeerbaar
 * (`site.indexable: false` of NUXT_SITE_INDEXABLE=false), dan bestaat dit
 * bestand niet.
 */
export default defineEventHandler(async (event) => {
  if (!getSiteIndexable(event)) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }

  const { url: siteUrl } = getSiteConfig(event);
  const base = String(siteUrl).replace(/\/$/, "");

  const rows = await db
    .select({
      slug: categories.slug,
      name: categories.name,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true)),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));

  const categoryLines = rows
    .filter((c) => c.productCount > 0)
    .map((c) => `- ${c.name}: ${c.productCount} producten`);

  const body = [
    `# ${COMPANY.name}`,
    "",
    `> ${COMPANY.name} is een familiebedrijf uit ${COMPANY.city} (sinds ${COMPANY.foundingYear}, derde generatie) dat meer dan ${COMPANY.productCount} vleeswaren en aanverwante producten levert aan handelaars in België. Bestellen kan via mail, fax, telefoon of online; levering de dag nadien door eigen chauffeurs.`,
    "",
    "## Contact",
    "",
    `- Adres: ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, België`,
    `- Telefoon: ${COMPANY.phone}`,
    `- GSM ${COMPANY.mobileName}: ${COMPANY.mobile}`,
    `- GSM ${COMPANY.mobile2Name}: ${COMPANY.mobile2}`,
    `- E-mail: ${COMPANY.email}`,
    `- [Contactpagina](${base}/contact)`,
    "",
    "## Assortiment",
    "",
    ...categoryLines,
    "",
    "## Veelgestelde vragen",
    "",
    `Antwoorden op bestellen, levering en ontbrekende artikelen: [Veelgestelde vragen](${base}/veelgestelde-vragen).`,
    "",
    ...FAQ.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]),
  ].join("\n");

  setHeader(event, "content-type", "text/plain; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=3600");
  return body;
});
