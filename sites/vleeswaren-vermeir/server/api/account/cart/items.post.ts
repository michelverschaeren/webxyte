import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * POST /api/account/cart/items — één product aan het mandje toevoegen.
 * Net als bij lijsten/bestellingen stuurt de client enkel articleNr + aantal,
 * nooit een database-id. Bestaat het product al in het mandje, dan telt het
 * aantal op i.p.v. een dubbele rij aan te maken.
 */
const bodySchema = z.object({
  articleNr: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(9999).default(1),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const product = (await resolveProductsByArticleNr([body.articleNr])).get(
    body.articleNr,
  );

  if (!product || !product.isActive) {
    throw createError({
      statusCode: 422,
      statusMessage: "PRODUCT_NIET_BESCHIKBAAR",
      message: "Dit artikel is niet meer beschikbaar.",
    });
  }

  await db
    .insert(cartItems)
    .values({ userId: user.id, productId: product.id, quantity: body.quantity })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: {
        quantity: sql`${cartItems.quantity} + ${body.quantity}`,
        updatedAt: new Date(),
      },
    });

  return { items: await getCartItems(user.id) };
});
