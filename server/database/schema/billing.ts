import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Facturatiegegevens — één profiel per klant, aangemaakt zodra de klant
 * dit voor het eerst invult (bv. bij zijn eerste bestelling).
 */
export const billingDetails = pgTable(
  "billing_details",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyName: text().notNull(),
    /** Optioneel: niet elke klant heeft meteen een BTW-nummer klaar. */
    vatNumber: text(),
    street: text().notNull(),
    postalCode: text().notNull(),
    city: text().notNull(),
    country: text().default("België").notNull(),
    phone: text().notNull(),
    invoiceEmail: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("billing_details_user_id_idx").on(table.userId)],
);

export type BillingDetails = typeof billingDetails.$inferSelect;
export type NewBillingDetails = typeof billingDetails.$inferInsert;
