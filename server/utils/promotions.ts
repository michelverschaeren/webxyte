import { inArray } from "drizzle-orm";
import { z } from "zod";
import {
  isoDateSchema,
  normalizeDiscount,
  promotionDiscountSchema,
} from "../../shared/promotion";
import { db } from "~~/server/database/client";
import { customers, products } from "~~/server/database/schema";

/**
 * Gedeelde invoer van POST en PATCH /api/admin/promotions: korting, periode
 * en klanten. `customerIds: null` = alle klanten.
 */
export const promotionFieldsSchema = z
  .object({
    discount: promotionDiscountSchema,
    startsOn: isoDateSchema,
    endsOn: isoDateSchema,
    customerIds: z.array(z.uuid()).min(1).max(2000).nullable(),
  })
  .refine((v) => v.endsOn >= v.startsOn, {
    message: "De einddatum ligt vóór de begindatum.",
    path: ["endsOn"],
  });

export type PromotionFields = z.infer<typeof promotionFieldsSchema>;

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
