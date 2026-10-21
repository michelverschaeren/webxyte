import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  customers,
  products,
  promotionCustomers,
  promotionGroups,
  promotions,
} from "~~/server/database/schema";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * GET /api/admin/promotion-groups/:id — de volledige groep voor de wizard,
 * los van de filters op de lijst (PUT vervangt altijd de hele groep).
 * Periode en klanten zijn gelijk voor de hele groep; ze komen van de eerste
 * promotie.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) => paramsSchema.parse(data));

  const [group] = await db
    .select({ id: promotionGroups.id, name: promotionGroups.name })
    .from(promotionGroups)
    .where(eq(promotionGroups.id, id));
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: "Promotiegroep niet gevonden." });
  }

  const rows = await db
    .select({
      id: promotions.id,
      type: promotions.type,
      percentage: promotions.percentage,
      minQuantity: promotions.minQuantity,
      buyQuantity: promotions.buyQuantity,
      freeQuantity: promotions.freeQuantity,
      price: promotions.price,
      startsOn: promotions.startsOn,
      endsOn: promotions.endsOn,
      allCustomers: promotions.allCustomers,
      product: {
        id: products.id,
        articleNr: products.articleNr,
        name: products.name,
        unit: products.unit,
        price: products.price,
      },
    })
    .from(promotions)
    .innerJoin(products, eq(products.id, promotions.productId))
    .where(eq(promotions.groupId, id))
    .orderBy(asc(products.name));

  const first = rows[0];
  const groupCustomers =
    first && !first.allCustomers
      ? await db
          .select({ id: customers.id, customerNr: customers.customerNr, name: customers.name })
          .from(promotionCustomers)
          .innerJoin(customers, eq(customers.id, promotionCustomers.customerId))
          .where(eq(promotionCustomers.promotionId, first.id))
          .orderBy(asc(customers.name))
      : [];

  return {
    ...group,
    startsOn: first?.startsOn ?? null,
    endsOn: first?.endsOn ?? null,
    allCustomers: first?.allCustomers ?? true,
    customers: groupCustomers,
    items: rows.map((r) => ({
      product: {
        ...r.product,
        price: r.product.price === null ? null : Number(r.product.price),
      },
      discount: {
        type: r.type,
        percentage: r.percentage === null ? null : Number(r.percentage),
        minQuantity: r.minQuantity,
        buyQuantity: r.buyQuantity,
        freeQuantity: r.freeQuantity,
        price: r.price === null ? null : Number(r.price),
      },
    })),
  };
});
