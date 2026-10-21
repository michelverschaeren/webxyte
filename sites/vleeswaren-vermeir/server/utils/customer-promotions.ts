import { and, eq, exists, gte, inArray, lte, or } from "drizzle-orm";
import {
  promotionHint,
  promotionLabel,
  todayInBrussels,
  type PromotionDiscount,
} from "../../shared/promotion";
import { db } from "~~/server/database/client";
import { customers, products, promotionCustomers, promotions } from "~~/server/database/schema";

/** Een promotie zoals de klant (en de bestelmail) ze te zien krijgt. */
export interface CustomerPromotion extends PromotionDiscount {
  id: string;
  productId: string;
  /** Korte omschrijving, bv. "2+1 gratis" (zie shared/promotion.ts). */
  label: string;
  /** Uitleg voor de klant, bv. "Bestel 4 stuks, betaal er 3". */
  hint: string;
  /** Laatste dag (inclusief), "JJJJ-MM-DD". */
  endsOn: string;
}

/**
 * Promoties die vandaag (Belgische kalenderdag) gelden voor deze login: de
 * promoties voor alle klanten, plus die waaraan de klant achter deze login
 * gekoppeld is. Optioneel beperkt tot bepaalde producten.
 *
 * Geeft per product-id de lijst promoties terug (meestal één).
 */
export async function activePromotionsForUser(
  userId: string,
  productIds?: string[],
): Promise<Map<string, CustomerPromotion[]>> {
  const byProduct = new Map<string, CustomerPromotion[]>();
  if (productIds && productIds.length === 0) return byProduct;

  const today = todayInBrussels();

  const rows = await db
    .select({
      id: promotions.id,
      productId: promotions.productId,
      type: promotions.type,
      percentage: promotions.percentage,
      minQuantity: promotions.minQuantity,
      buyQuantity: promotions.buyQuantity,
      freeQuantity: promotions.freeQuantity,
      price: promotions.price,
      endsOn: promotions.endsOn,
    })
    .from(promotions)
    // Enkel producten die nog in het assortiment zitten.
    .innerJoin(products, and(eq(products.id, promotions.productId), eq(products.isActive, true)))
    .where(
      and(
        lte(promotions.startsOn, today),
        gte(promotions.endsOn, today),
        productIds ? inArray(promotions.productId, productIds) : undefined,
        or(
          eq(promotions.allCustomers, true),
          exists(
            db
              .select({ one: promotionCustomers.customerId })
              .from(promotionCustomers)
              .innerJoin(customers, eq(customers.id, promotionCustomers.customerId))
              .where(
                and(
                  eq(promotionCustomers.promotionId, promotions.id),
                  eq(customers.userId, userId),
                ),
              ),
          ),
        ),
      ),
    );

  for (const row of rows) {
    const discount: PromotionDiscount = {
      type: row.type,
      percentage: row.percentage === null ? null : Number(row.percentage),
      minQuantity: row.minQuantity,
      buyQuantity: row.buyQuantity,
      freeQuantity: row.freeQuantity,
      price: row.price === null ? null : Number(row.price),
    };
    const list = byProduct.get(row.productId) ?? [];
    list.push({
      ...discount,
      id: row.id,
      productId: row.productId,
      label: promotionLabel(discount),
      hint: promotionHint(discount),
      endsOn: row.endsOn,
    });
    byProduct.set(row.productId, list);
  }

  return byProduct;
}
