import { readProductDoc } from "~~/server/utils/product-docs";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * GET /docs/products/:file — serveert een productfiche uit de fiche-opslag
 * (zie server/utils/product-docs.ts). Vervangt de statische bestanden die vroeger
 * in public/docs/ stonden; de URL is ongewijzigd. Enkel voor ingelogde
 * klanten: een fiche verraadt de fabrikant van het artikel.
 */
const SAFE_FILE_NAME = /^[\w.-]+\.pdf$/i;

export default defineEventHandler(async (event) => {
  await requireUser(event);

  const file = getRouterParam(event, "file") ?? "";

  // Enkel een kale bestandsnaam: geen paden, geen "..".
  if (!SAFE_FILE_NAME.test(file) || file.includes("..")) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }

  const doc = await readProductDoc(file);
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }

  setHeader(event, "content-type", "application/pdf");
  setHeader(event, "content-length", doc.size);
  setHeader(event, "content-disposition", "inline");
  setHeader(event, "last-modified", doc.lastModified.toUTCString());
  // Een vervangen fiche houdt dezelfde URL, dus geen lange cache. `private`:
  // een gedeelde cache/CDN mag een fiche niet aan gasten doorgeven.
  setHeader(event, "cache-control", "private, max-age=300");
  // De fabrikant per artikel is bedrijfsgevoelig: laat dit nooit indexeren,
  // ook niet als een link naar een PDF ergens uitlekt.
  setHeader(event, "x-robots-tag", "noindex, nofollow, noarchive");
  // Vervangt de site-brede policy uit nuxt.config.ts: een PDF heeft geen
  // scripts of stijlen te beperken, en `object-src 'none'` kan de ingebouwde
  // PDF-viewer van de browser hinderen. Inlijsten blijft enkel op eigen site.
  setHeader(event, "content-security-policy", "frame-ancestors 'self'");

  return sendStream(event, doc.stream);
});
