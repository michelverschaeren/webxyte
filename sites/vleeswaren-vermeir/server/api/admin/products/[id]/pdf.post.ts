import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { writeProductDoc } from "~~/server/utils/product-docs";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * POST /api/admin/products/:id/pdf — upload/vervang de productfiche.
 * Slaat op als <articleNr>.pdf in de fiche-opslag (server/utils/product-docs.ts) —
 * zelfde conventie als de legacy-import (server/database/import-legacy.ts).
 */
const paramsSchema = z.object({ id: z.uuid() });

// Een Vercel-functie weigert een request-body boven 4,5 MB, nog vóór deze
// handler draait; daar ligt de grens dus lager dan op een eigen server.
const MAX_SIZE_MB = process.env.VERCEL ? 4 : 15;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const [product] = await db
    .select({ articleNr: products.articleNr })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "file");

  if (!file || !file.data.length) {
    throw createError({ statusCode: 400, statusMessage: "Geen bestand ontvangen." });
  }
  if (file.type !== "application/pdf") {
    throw createError({
      statusCode: 400,
      statusMessage: "Enkel PDF-bestanden zijn toegestaan.",
    });
  }
  if (file.data.length > MAX_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: `Bestand is groter dan ${MAX_SIZE_MB}MB.`,
    });
  }
  // Content-Type komt van de client en is te vervalsen; de echte PDF-magic
  // bytes controleren voorkomt dat een ander bestandstype als .pdf onder
  // /docs/products/ terechtkomt en publiek geserveerd wordt.
  if (file.data.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bestand is geen geldig PDF-bestand.",
    });
  }

  const fileName = `${product.articleNr}.pdf`;
  await writeProductDoc(fileName, file.data);

  const infoPdf = `/docs/products/${fileName}`;
  const [updated] = await db
    .update(products)
    .set({ infoPdf })
    .where(eq(products.id, id))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  return { ...updated, price: updated.price ? Number(updated.price) : null };
});
