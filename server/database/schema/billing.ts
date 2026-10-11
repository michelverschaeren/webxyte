import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Facturatiegegevens — één profiel per klant, aangemaakt zodra de klant
 * dit voor het eerst invult. Optioneel: bestellen kan ook zonder (zie
 * `BillingSnapshot`). Bewust zonder telefoon en leveringsadres: die staan op
 * één plaats, bij de klant (`customers`).
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
    /**
     * Verouderd en niet meer gebruikt: het telefoonnummer staat bij de klant
     * (`customers.phone`). De kolom verdwijnt in een latere migratie.
     */
    phone: text(),
    invoiceEmail: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("billing_details_user_id_idx").on(table.userId)],
);

/**
 * Wat er van de klant op een bestelling bevroren wordt (`orders.billingSnapshot`).
 * Komt uit de facturatiegegevens als de klant die invulde, anders uit het
 * CRM en de login; telefoonnummer en leveringsadres altijd van de klant zelf.
 * Het adres ontbreekt op bestellingen van voor het leveringsadres bestond.
 */
export interface BillingSnapshot {
  companyName: string;
  vatNumber: string | null;
  phone: string | null;
  invoiceEmail: string;
  /** Leveringsadres: straat + nummer, postcode en gemeente. */
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
}

export type BillingDetails = typeof billingDetails.$inferSelect;
export type NewBillingDetails = typeof billingDetails.$inferInsert;
