import { inArray } from "drizzle-orm";
import { z } from "zod";
import {
  isoDateSchema,
  normalizeDiscount,
  promotionDiscountSchema,
} from "../../shared/promotion";
import { db } from "~~/server/database/client";
import {
  customers,
  products,
  promotionCustomers,
  promotions,
} from "~~/server/database/schema";

/** Periode en klanten; `customerIds: null` = alle klanten. */
const periodFields = {
  startsOn: isoDateSchema,
  endsOn: isoDateSchema,
  customerIds: z.array(z.uuid()).min(1).max(2000).nullable(),
};

const periodCheck: [
  (v: { startsOn: string; endsOn: string }) => boolean,
  { message: string; path: string[] },
] = [
  (v) => v.endsOn >= v.startsOn,
  { message: "De einddatum ligt vóór de begindatum.", path: ["endsOn"] },
];

/** Invoer van PATCH /api/admin/promotions/:id: korting, periode en klanten. */
export const promotionFieldsSchema = z
  .object({ discount: promotionDiscountSchema, ...periodFields })
  .refine(...periodCheck);

export type PromotionFields = z.infer<typeof promotionFieldsSchema>;

/**
 * Invoer van POST /api/admin/promotions en PUT /api/admin/promotion-groups/:id:
 * één periode en klantenlijst voor alle producten, elk product met een eigen
 * korting (zoals in een folder).
 */
export const promotionGroupFieldsSchema = z
  .object({
    items: z
      .array(z.object({ productId: z.uuid(), discount: promotionDiscountSchema }))
      .min(1)
      .max(200)
      .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, {
        message: "Elk product mag maar één keer in de promotie staan.",
      }),
    ...periodFields,
  })
  .refine(...periodCheck);

export type PromotionGroupFields = z.infer<typeof promotionGroupFieldsSchema>;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Maakt per product een promotie aan (met klanten), eventueel in een groep. */
export async function insertPromotions(
  tx: Transaction,
  fields: PromotionGroupFields,
  groupId: string | null,
) {
  const rows = await tx
    .insert(promotions)
    .values(
      fields.items.map((item) => ({
        ...promotionColumns({ ...fields, discount: item.discount }),
        productId: item.productId,
        groupId,
      })),
    )
    .returning({ id: promotions.id });

  if (fields.customerIds) {
    const customerIds = [...new Set(fields.customerIds)];
    await tx.insert(promotionCustomers).values(
      rows.flatMap((row) => customerIds.map((customerId) => ({ promotionId: row.id, customerId }))),
    );
  }
  return rows;
}

/** Kolomwaarden voor `promotions`, klaar om te inserten of te updaten. */
export function promotionColumns(fields: PromotionFields) {
  const d = normalizeDiscount(fields.discount);
  return {
    type: d.type,
    percentage: d.percentage === null ? null : d.percentage.toFixed(2),
    minQuantity: d.minQuantity,
    buyQuantity: d.buyQuantity,
    freeQuantity: d.freeQuantity,
    price: d.price === null ? null : d.price.toFixed(2),
    startsOn: fields.startsOn,
    endsOn: fields.endsOn,
    allCustomers: fields.customerIds === null,
  };
}

/** 400 als een van de producten of klanten niet (meer) bestaat. */
export async function assertPromotionRefs(productIds: string[], customerIds: string[] | null) {
  const uniqueProducts = [...new Set(productIds)];
  const foundProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.id, uniqueProducts));
  if (foundProducts.length !== uniqueProducts.length) {
    throw createError({ statusCode: 400, statusMessage: "Een of meer producten bestaan niet meer." });
  }

  if (customerIds) {
    const uniqueCustomers = [...new Set(customerIds)];
    const foundCustomers = await db
      .select({ id: customers.id })
      .from(customers)
      .where(inArray(customers.id, uniqueCustomers));
    if (foundCustomers.length !== uniqueCustomers.length) {
      throw createError({ statusCode: 400, statusMessage: "Een of meer klanten bestaan niet meer." });
    }
  }
}
