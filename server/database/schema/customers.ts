import { relations } from "drizzle-orm";
import {
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
 * Klanten zoals ze in het CRM staan — los van `user` (de login). Facturatie
 * blijft in het CRM; hier enkel wat de webshop nodig heeft om te leveren.
 *
 * Contactmail is bewust niet uniek: in het CRM delen meerdere klantnummers
 * soms één adres (bv. Wolkenhoeve). Om dezelfde reden kan één login aan
 * meerdere klanten gekoppeld worden via `userId`.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Klantnummer uit het CRM, bv. "100145" — de natuurlijke sleutel. */
    customerNr: text().notNull(),
    name: text().notNull(),
    contactEmail: text(),
    phone: text(),
    deliveryStreet: text(),
    deliveryPostalCode: text(),
    deliveryCity: text(),
    deliveryCountry: text().default("België").notNull(),
    /** Gekoppelde login; null zolang de klant nog geen account heeft. */
    userId: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("customers_customer_nr_idx").on(table.customerNr),
    index("customers_user_id_idx").on(table.userId),
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
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerPurchaseHistory = typeof customerPurchaseHistory.$inferSelect;
