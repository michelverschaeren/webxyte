import { and, asc, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/client";
import { customerAddresses, customers } from "../database/schema";
import {
  ADDRESS_ERROR,
  POSTAL_CODE_ERROR,
  POSTAL_CODE_PATTERN,
} from "../../shared/address";

/**
 * Leveringsadressen van een klant. Eén klant kan er meerdere hebben; precies
 * één is het primaire (de standaard bij een bestelling). De klant beheert ze
 * zelf (Mijn account, bestelpopup), de beheerder via het klantprofiel —
 * beide via deze functies, zodat de regels rond "primair" op één plek staan.
 */
const MAX_ADDRESSES = 10;

export const addressSchema = z.object({
  street: z.string().trim().min(1, ADDRESS_ERROR).max(200, ADDRESS_ERROR),
  postalCode: z.string().trim().regex(POSTAL_CODE_PATTERN, POSTAL_CODE_ERROR),
  city: z.string().trim().min(1, ADDRESS_ERROR).max(100, ADDRESS_ERROR),
  /** `true` maakt dit het primaire adres; het vorige primaire verliest dat. */
  isPrimary: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

const addressColumns = {
  id: customerAddresses.id,
  street: customerAddresses.street,
  postalCode: customerAddresses.postalCode,
  city: customerAddresses.city,
  isPrimary: customerAddresses.isPrimary,
};

/**
 * De klant achter een login. Gooit een 403 voor een login zonder klant
 * (beheerder): die heeft geen leveringsadressen.
 */
export async function requireCustomerId(userId: string) {
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);

  if (!customer) {
    throw createError({
      statusCode: 403,
      statusMessage: "Enkel klanten hebben een leveringsadres.",
    });
  }
  return customer.id;
}

/** Alle adressen van een klant, het primaire eerst. */
export function listAddresses(customerId: string) {
  return db
    .select(addressColumns)
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customerId))
    .orderBy(desc(customerAddresses.isPrimary), asc(customerAddresses.createdAt));
}

/** Voegt een adres toe. Het eerste adres van een klant is altijd primair. */
export async function createAddress(
  customerId: string,
  { isPrimary, ...values }: AddressInput,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId));

    if (existing.length >= MAX_ADDRESSES) {
      throw createError({
        statusCode: 400,
        statusMessage: `U kunt maximaal ${MAX_ADDRESSES} leveringsadressen bewaren.`,
      });
    }

    const primary = isPrimary || existing.length === 0;
    if (primary) {
      await tx
        .update(customerAddresses)
        .set({ isPrimary: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [created] = await tx
      .insert(customerAddresses)
      .values({ ...values, customerId, isPrimary: primary })
      .returning(addressColumns);
    return created!;
  });
}

/**
 * Wijzigt een adres van deze klant. `isPrimary: true` maakt het primair;
 * primair-af kan enkel door een ander adres primair te maken.
 */
export async function updateAddress(
  customerId: string,
  addressId: string,
  { isPrimary, ...values }: AddressInput,
) {
  return db.transaction(async (tx) => {
    if (isPrimary) {
      await tx
        .update(customerAddresses)
        .set({ isPrimary: false })
        .where(
          and(
            eq(customerAddresses.customerId, customerId),
            ne(customerAddresses.id, addressId),
          ),
        );
    }

    const [updated] = await tx
      .update(customerAddresses)
      .set({ ...values, ...(isPrimary ? { isPrimary: true } : {}) })
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId),
        ),
      )
      .returning(addressColumns);

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: "Adres niet gevonden." });
    }
    return updated;
  });
}

/**
 * Verwijdert een adres van deze klant. Was het primair, dan wordt het oudste
 * overblijvende adres primair. Bestaande bestellingen houden hun eigen kopie.
 */
export async function deleteAddress(customerId: string, addressId: string) {
  await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId),
        ),
      )
      .returning({ isPrimary: customerAddresses.isPrimary });

    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: "Adres niet gevonden." });
    }
    if (!deleted.isPrimary) return;

    const [next] = await tx
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(asc(customerAddresses.createdAt))
      .limit(1);
    if (next) {
      await tx
        .update(customerAddresses)
        .set({ isPrimary: true })
        .where(eq(customerAddresses.id, next.id));
    }
  });
}
