import { desc, eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { savedListItems, savedLists } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * GET /api/account/lists — alle bestellijstjes van de klant.
 *
 * De items joinen live met `products`: een lijstje moet altijd de actuele
 * catalogus tonen. `available` zegt of het product nog in het assortiment zit,
 * zodat de UI verdwenen artikelen kan markeren i.p.v. stil weglaten.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const lists = await db.query.savedLists.findMany({
    where: eq(savedLists.userId, user.id),
    orderBy: desc(savedLists.updatedAt),
    with: {
      items: {
        orderBy: savedListItems.createdAt,
        with: { product: true },
      },
    },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    createdAt: list.createdAt.getTime(),
    updatedAt: list.updatedAt.getTime(),
    items: list.items
      .filter((item) => item.product !== null)
      .map((item) => ({
        // Het mandje herkent een regel aan het artikelnummer, niet aan een
        // database-id — de productenpagina werkt nog met de statische lijst.
        id: item.product!.articleNr,
        articleNr: item.product!.articleNr,
        name: item.product!.name,
        supplier: item.product!.supplier,
        unit: item.product!.unit ?? undefined,
        quantity: item.quantity,
        available: item.product!.isActive,
      })),
  }));
});
