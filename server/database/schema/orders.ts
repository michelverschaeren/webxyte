import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products } from "./catalog";

/** Gedeelde bron voor de pgTable-enum en toekomstige Zod-schema's. */
export const ORDER_STATUSES = [
  "nieuw",
  "in_behandeling",
  "voltooid",
  "geannuleerd",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Geen "verwijder klant"-functie vandaag, dus RESTRICT kost niets en
    // beschermt bestelgeschiedenis (financieel/audit-record).
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: text({ enum: ORDER_STATUSES }).default("nieuw").notNull(),
    /** Naam die de klant zelf aan de bestelling gaf bij het plaatsen. */
    name: text(),
    /** Vrije notitie van de klant bij het plaatsen van de bestelling. */
    note: text(),
    /**
     * Bevroren kopie van billingDetails op het moment van bestellen —
     * facturatiegegevens kunnen later wijzigen, de bestelling moet tonen
     * wat er toen gold.
     */
    billingSnapshot: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("orders_user_id_idx").on(table.userId)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Enkel handig voor "opnieuw bestellen" — nooit gebruikt voor weergave. */
    productId: uuid().references(() => products.id, { onDelete: "set null" }),
    // Snapshot van het product op bestelmoment: een bestelling moet tonen
    // wat er toen echt besteld werd, ook als het product intussen
    // hernoemd of gedeactiveerd is.
    articleNr: text().notNull(),
    name: text().notNull(),
    supplier: text().notNull(),
    unit: text(),
    quantity: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
