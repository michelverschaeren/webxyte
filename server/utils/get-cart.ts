import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";

/** Het winkelmandje van een klant, live gejoint met de catalogus. */
export async function getCartItems(userId: string) {
  const rows = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    orderBy: asc(cartItems.createdAt),
    with: { product: true },
  });

  return rows
    .filter((row) => row.product !== null)
    .map((row) => ({
      id: row.productId,
      articleNr: row.product!.articleNr,
      name: row.product!.name,
      supplier: row.product!.supplier,
      unit: row.product!.unit ?? undefined,
      quantity: row.quantity,
    }));
}
