/**
 * Promoties per product. Gewoon TS zonder Nuxt-imports, zodat de wizard
 * (formulier) en de Nitro-server (validatie) dezelfde regels en labels
 * gebruiken.
 *
 * Drie soorten korting dekken de gangbare acties:
 * - `percentage`: X% korting, eventueel pas vanaf een minimum aantal stuks
 *   ("10%", "25% vanaf 2 stuks", "15% bij 2 identieke stuks").
 * - `free_items`: koop X, krijg Y gratis ("3+1 gratis").
 * - `fixed_price`: vaste promoprijs per stuk, eventueel vanaf een minimum.
 */
import { z } from "zod";

export const PROMOTION_TYPES = ["percentage", "free_items", "fixed_price"] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "Percentage korting",
  free_items: "Gratis stuks (bv. 3+1)",
  fixed_price: "Vaste promoprijs",
};

/** De korting zelf; de velden die niet bij het type horen blijven `null`. */
export interface PromotionDiscount {
  type: PromotionType;
  /** Bij `percentage`: 0 < x < 100. */
  percentage: number | null;
  /** Bij `percentage` en `fixed_price`: korting geldt vanaf dit aantal stuks. */
  minQuantity: number;
  /** Bij `free_items`: zoveel kopen… */
  buyQuantity: number | null;
  /** …en zoveel extra gratis. */
  freeQuantity: number | null;
  /** Bij `fixed_price`: prijs per stuk in euro. */
  price: number | null;
}

export const promotionDiscountSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percentage"),
    percentage: z.number().gt(0).lt(100),
    minQuantity: z.number().int().min(1).max(999).default(1),
  }),
  z.object({
    type: z.literal("free_items"),
    buyQuantity: z.number().int().min(1).max(999),
    freeQuantity: z.number().int().min(1).max(999),
  }),
  z.object({
    type: z.literal("fixed_price"),
    price: z.number().gt(0).max(100000),
    minQuantity: z.number().int().min(1).max(999).default(1),
  }),
]);

/** Kalenderdag als "YYYY-MM-DD", zoals een `<input type="date">` hem geeft. */
export const isoDateSchema = z.iso.date();

/** Zet de gevalideerde invoer om naar de volledige vorm (lege velden `null`). */
export function normalizeDiscount(
  input: z.infer<typeof promotionDiscountSchema>,
): PromotionDiscount {
  return {
    type: input.type,
    percentage: input.type === "percentage" ? input.percentage : null,
    minQuantity: input.type === "free_items" ? 1 : input.minQuantity,
    buyQuantity: input.type === "free_items" ? input.buyQuantity : null,
    freeQuantity: input.type === "free_items" ? input.freeQuantity : null,
    price: input.type === "fixed_price" ? input.price : null,
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString("nl-BE", { maximumFractionDigits: 2 });
}

/** Korte omschrijving voor lijsten, bv. "25% vanaf 2 stuks" of "3+1 gratis". */
export function promotionLabel(d: PromotionDiscount): string {
  const from = d.minQuantity > 1 ? ` vanaf ${d.minQuantity} stuks` : "";
  switch (d.type) {
    case "percentage":
      return `${formatNumber(d.percentage ?? 0)}% korting${from}`;
    case "free_items":
      return `${d.buyQuantity ?? 0}+${d.freeQuantity ?? 0} gratis`;
    case "fixed_price":
      return `€ ${(d.price ?? 0).toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per stuk${from}`;
  }
}

/**
 * Een promotie zoals ze op een bestelregel bevroren wordt
 * (`orderItems.promotions`): wat er op het moment van bestellen gold.
 */
export interface OrderLinePromotion {
  /** bv. "3+1 gratis" */
  label: string;
  /** Minimum aantal gehaald? */
  reached: boolean;
  /** bv. "waarvan 1 gratis" of "pas vanaf 4 stuks" */
  note: string;
}

/** Uitleg voor de klant, bv. "Bestel 4 stuks, betaal er 3". */
export function promotionHint(d: PromotionDiscount): string {
  switch (d.type) {
    case "free_items": {
      const buy = d.buyQuantity ?? 0;
      const free = d.freeQuantity ?? 0;
      return `Bestel ${buy + free} stuks, betaal er ${buy}`;
    }
    case "percentage":
    case "fixed_price":
      return d.minQuantity > 1
        ? `Geldt bij een bestelling van minstens ${d.minQuantity} stuks`
        : "Geldt vanaf 1 stuk";
  }
}

/**
 * Wat een promotie betekent voor een bestelregel van `quantity` stuks, voor
 * de bestelmail en de bestelbon. De zaak rekent zelf af; dit is enkel ter
 * info, zodat zichtbaar is welke promotie de klant verwacht.
 * - `reached`: de voorwaarde (minimum aantal) is gehaald;
 * - `note`: korte toelichting, bv. "waarvan 1 gratis" of "pas vanaf 4 stuks".
 */
export function promotionOutcome(
  d: PromotionDiscount,
  quantity: number,
): { reached: boolean; note: string } {
  if (d.type === "free_items") {
    // "3+1 gratis": de klant bestelt alle 4 stuks zelf en betaalt er 3. Per
    // volledige schijf van 3+1 = 4 stuks is er 1 gratis, niets wordt erbij gedaan.
    const bundle = (d.buyQuantity ?? 0) + (d.freeQuantity ?? 0);
    const free = d.freeQuantity ?? 0;
    if (bundle < 2 || quantity < bundle) {
      return { reached: false, note: `pas vanaf ${bundle} stuks` };
    }
    return { reached: true, note: `waarvan ${Math.floor(quantity / bundle) * free} gratis` };
  }
  if (quantity < d.minQuantity) {
    return { reached: false, note: `pas vanaf ${d.minQuantity} stuks` };
  }
  return { reached: true, note: "van toepassing" };
}

/** Status t.o.v. vandaag (Belgische kalenderdag). */
export type PromotionStatus = "scheduled" | "active" | "expired";

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  scheduled: "Gepland",
  active: "Actief",
  expired: "Verlopen",
};

/** Vandaag als "YYYY-MM-DD" in Belgische tijd. */
export function todayInBrussels(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
}

export function promotionStatus(startsOn: string, endsOn: string, today = todayInBrussels()): PromotionStatus {
  if (startsOn > today) return "scheduled";
  if (endsOn < today) return "expired";
  return "active";
}
