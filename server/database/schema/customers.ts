import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products } from "./catalog";

/**
 * Klanten zoals ze in het CRM staan. Facturatie blijft in het CRM; hier
 * enkel wat de webshop nodig heeft om de klant te herkennen en te beleveren.
 * Telefoon en leveringsadressen (`customerAddresses`) staan enkel hier: de
 * klant (Mijn account) en de beheerder (klantprofiel) zien en wijzigen
 * dezelfde gegevens.
 *
 * Eén klantnummer = één e-mailadres = één login. Het contactadres is ook het
 * login-adres: bij de uitnodiging wordt er een `user` mee aangemaakt (zie
 * server/utils/customer-login.ts). Beide zijn daarom uniek.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Klantnummer uit het CRM, bv. "100145" — de natuurlijke sleutel. */
    customerNr: text().notNull(),
    name: text().notNull(),
    /** Ook het login-adres; altijd in kleine letters opgeslagen. */
    contactEmail: text(),
    phone: text(),
    /** De login van deze klant; null zolang de klant niet uitgenodigd is. */
    userId: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("customers_customer_nr_idx").on(table.customerNr),
    uniqueIndex("customers_contact_email_idx").on(sql`lower(${table.contactEmail})`),
    uniqueIndex("customers_user_id_idx").on(table.userId),
  ],
);

/**
 * Leveringsadressen van een klant: straat + huisnummer, postcode en gemeente.
 * Een klant kan er meerdere hebben; precies één is primair, de standaard bij
 * een bestelling (zie server/utils/customer-addresses.ts). Een bestelling
 * bewaart haar eigen kopie van het gekozen adres (`BillingSnapshot`).
 */
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid().primaryKey().defaultRandom(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    street: text().notNull(),
    postalCode: text().notNull(),
    city: text().notNull(),
    isPrimary: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("customer_addresses_customer_id_idx").on(table.customerId),
    // Hoogstens één primair adres per klant.
    uniqueIndex("customer_addresses_primary_idx")
      .on(table.customerId)
      .where(sql`is_primary`),
  ],
);

/**
 * Aankoophistoriek uit het CRM: één rij per klant × product met de datum
 * van de laatste aankoop. Voedt "eerder afgenomen producten", naast de
 * bestellingen die via de webshop zelf binnenkomen (`orderItems`).
 */
export const customerPurchaseHistory = pgTable(
  "customer_purchase_history",
  {
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    lastPurchasedAt: date().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.customerId, table.productId] }),
    index("customer_purchase_history_product_id_idx").on(table.productId),
  ],
);

export const customersRelations = relations(customers, ({ many }) => ({
  purchaseHistory: many(customerPurchaseHistory),
}));

export const customerPurchaseHistoryRelations = relations(
  customerPurchaseHistory,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerPurchaseHistory.customerId],
      references: [customers.id],
    }),
    product: one(products, {
      fields: [customerPurchaseHistory.productId],
      references: [products.id],
    }),
  }),
);

export type Customer = typeof customers.$inferSelect;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerPurchaseHistory = typeof customerPurchaseHistory.$inferSelect;
