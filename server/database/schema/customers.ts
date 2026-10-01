import { relations, sql } from "drizzle-orm";
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
 * Klanten zoals ze in het CRM staan. Facturatie blijft in het CRM; hier
 * enkel wat de webshop nodig heeft om te leveren.
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
    deliveryStreet: text(),
    deliveryPostalCode: text(),
    deliveryCity: text(),
    deliveryCountry: text().default("België").notNull(),
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
