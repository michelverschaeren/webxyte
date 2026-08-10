/**
 * Telt aantallen op per product, zodat hetzelfde artikel nooit twee keer
 * in één lijst of bestelling terechtkomt.
 */
export function mergeQuantities<T extends { productId: string; quantity: number }>(
  items: T[],
): Array<{ productId: string; quantity: number }> {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

/** Zelfde, maar op artikelnummer — vóór het herleiden naar een productId. */
export function mergeQuantitiesByArticleNr<
  T extends { articleNr: string; quantity: number },
>(items: T[]): Array<{ articleNr: string; quantity: number }> {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(item.articleNr, (merged.get(item.articleNr) ?? 0) + item.quantity);
  }

  return [...merged].map(([articleNr, quantity]) => ({ articleNr, quantity }));
}
