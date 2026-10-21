import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products } from "./catalog";

/**
 * Winkelmandje van de ingelogde klant — per account in de database, zodat
 * het op elk toestel hetzelfde is. Joint live met `products`, net als
 * `savedListItems` (zie schema/lists.ts): een mandje toont altijd de
 * actuele catalogus, i.t.t. `orderItems` die bewust een snapshot bevriezen.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Eén regel per product per klant — opnieuw toevoegen telt op i.p.v.
    // een dubbele rij aan te maken.
    uniqueIndex("cart_items_user_product_idx").on(table.userId, table.productId),
  ],
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export type CartItemRow = typeof cartItems.$inferSelect;
export type NewCartItemRow = typeof cartItems.$inferInsert;
