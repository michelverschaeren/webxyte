import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/client";
import { customers } from "../database/schema";
import { ADDRESS_ERROR, POSTAL_CODE_ERROR } from "../../shared/address";
import { PHONE_ERROR, isValidPhone } from "../../shared/phone";

/**
 * Contactgegevens die de klant zelf beheert en die op één plaats staan
 * (`customers`), dezelfde die de beheerder ziet. Optioneel; een leeg veld
 * maakt het gegeven leeg. Leveringsadressen: zie customer-addresses.ts.
 */
export const contactFields = {
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((value) => value === "" || isValidPhone(value), PHONE_ERROR)
    .optional(),
};

export type CustomerContact = {
  [K in keyof typeof contactFields]?: string;
};

/** Meldingen die het formulier letterlijk aan de klant mag tonen. */
const FIELD_ERRORS = [PHONE_ERROR, POSTAL_CODE_ERROR, ADDRESS_ERROR];

/**
 * Valideert een body met contact- of adresvelden en geeft bij een fout de
 * melding van het veld zelf terug (telefoon, postcode, adres), zodat het
 * formulier ze kan tonen.
 */
export function parseContactBody<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;

  const issue = parsed.error.issues.find((i) => FIELD_ERRORS.includes(i.message));
  throw createError({
    statusCode: 400,
    statusMessage: issue?.message ?? "Controleer de ingevulde gegevens.",
  });
}

/**
 * Slaat de meegegeven contactvelden op bij de klant van deze login. Velden
 * die ontbreken (`undefined`) blijven ongemoeid. Een login zonder klant
 * (beheerder) heeft geen contactgegevens: dan gebeurt er niets.
 */
export async function saveCustomerContact(userId: string, contact: CustomerContact) {
  const values = Object.fromEntries(
    Object.entries(contact)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value || null]),
  );
  if (Object.keys(values).length === 0) return;

  await db.update(customers).set(values).where(eq(customers.userId, userId));
}
