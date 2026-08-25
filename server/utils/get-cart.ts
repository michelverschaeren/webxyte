import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";

/** Het winkelmandje van een klant, live gejoint met de catalogus. */
export async function getCartItems(userId: string) {
  const rows = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    // `id` als tiebreaker: regels die in bulk zijn toegevoegd (lijst
    // importeren, gastenmandje samenvoegen bij inloggen) delen exact
    // dezelfde `createdAt` (Postgres bevriest `now()` per transactie).
    // Zonder een unieke tweede sleutel viel de sortering bij zo'n
    // gelijkspel terug op de fysieke rijvolgorde, die verschuift zodra
    // een regel wordt geüpdatet — vandaar items die van plek wisselden
    // bij het aanpassen van een hoeveelheid.
    orderBy: [asc(cartItems.createdAt), asc(cartItems.id)],
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
