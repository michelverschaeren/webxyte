import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { productDocsDir } from "~~/server/utils/docs-dir";

/**
 * GET /docs/products/:file — serveert een productfiche uit de docs-map
 * (zie server/utils/docs-dir.ts). Vervangt de statische bestanden die vroeger
 * in public/docs/ stonden; de URL is ongewijzigd.
 */
const SAFE_FILE_NAME = /^[\w.-]+\.pdf$/i;

export default defineEventHandler((event) => {
  const file = getRouterParam(event, "file") ?? "";

  // Enkel een kale bestandsnaam: geen paden, geen "..".
  if (!SAFE_FILE_NAME.test(file) || file.includes("..")) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }

  const path = join(productDocsDir(), file);
  const stat = statSync(path, { throwIfNoEntry: false });
  if (!stat?.isFile()) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }

  setHeader(event, "content-type", "application/pdf");
  setHeader(event, "content-length", stat.size);
  setHeader(event, "content-disposition", "inline");
  setHeader(event, "last-modified", stat.mtime.toUTCString());
  // Een vervangen fiche houdt dezelfde URL, dus geen lange cache.
  setHeader(event, "cache-control", "public, max-age=300");
  // De fabrikant per artikel is bedrijfsgevoelig: laat dit nooit indexeren,
  // ook niet als een link naar een PDF ergens uitlekt.
  setHeader(event, "x-robots-tag", "noindex, nofollow, noarchive");

  return sendStream(event, createReadStream(path));
});
