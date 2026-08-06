import { z } from "zod";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/products — nieuw product aanmaken. Alleen voor beheerders.
 * Laat zien hoe auth-guard, body-validatie en een insert samenkomen.
 */
const bodySchema = z.object({
  articleNr: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(200),
  supplier: z.string().trim().min(1).max(200),
  categoryId: z.uuid(),
  unit: z.string().trim().max(64).optional(),
  infoPdf: z.url().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const [product] = await db.insert(products).values(body).returning();

  setResponseStatus(event, 201);
  return product;
});
