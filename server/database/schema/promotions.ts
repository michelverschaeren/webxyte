import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { PromotionType } from "../../../shared/promotion";
import { products } from "./catalog";
import { customers } from "./customers";

/**
 * Promotiegroepen: een naam ("Promotie op kaas") die promoties bundelt die
 * samen werden aangemaakt. In het beheer verschijnt een groep als één lijn
 * die openklapt naar de producten.
 */
export const promotionGroups = pgTable("promotion_groups", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Promoties: één korting op één product, binnen een periode, voor alle
 * klanten of een selectie (`promotionCustomers`). De soorten korting en hun
 * velden staan beschreven in shared/promotion.ts. Voorlopig enkel beheer:
 * de webshop past ze nog niet toe.
 */
export const promotions = pgTable(
  "promotions",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Optioneel: de groep waartoe de promotie behoort. */
    groupId: uuid().references(() => promotionGroups.id, { onDelete: "cascade" }),
    type: text().$type<PromotionType>().notNull(),
    percentage: numeric({ precision: 5, scale: 2 }),
    minQuantity: integer().default(1).notNull(),
    buyQuantity: integer(),
    freeQuantity: integer(),
    price: numeric({ precision: 10, scale: 2 }),
    /** Eerste en laatste dag (inclusief), als Belgische kalenderdag. */
    startsOn: date().notNull(),
    endsOn: date().notNull(),
    /** Geldt voor elke klant; anders enkel voor `promotionCustomers`. */
    allCustomers: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("promotions_product_id_idx").on(table.productId),
    index("promotions_group_id_idx").on(table.groupId),
    index("promotions_period_idx").on(table.startsOn, table.endsOn),
    check("promotions_period_check", sql`${table.endsOn} >= ${table.startsOn}`),
  ],
);

/** Klanten die recht hebben op een promotie met `allCustomers = false`. */
export const promotionCustomers = pgTable(
  "promotion_customers",
  {
    promotionId: uuid()
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.promotionId, table.customerId] }),
    index("promotion_customers_customer_id_idx").on(table.customerId),
  ],
);

export const promotionGroupsRelations = relations(promotionGroups, ({ many }) => ({
  promotions: many(promotions),
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  product: one(products, {
    fields: [promotions.productId],
    references: [products.id],
  }),
  group: one(promotionGroups, {
    fields: [promotions.groupId],
    references: [promotionGroups.id],
  }),
  customers: many(promotionCustomers),
}));

export const promotionCustomersRelations = relations(promotionCustomers, ({ one }) => ({
  promotion: one(promotions, {
    fields: [promotionCustomers.promotionId],
    references: [promotions.id],
  }),
  customer: one(customers, {
    fields: [promotionCustomers.customerId],
    references: [customers.id],
  }),
}));

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type PromotionGroup = typeof promotionGroups.$inferSelect;
