import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products } from "./catalog";

/**
 * Opgeslagen lijstjes (bv. "kazen", "kerstmis") — login-verplicht,
 * per klant. Bewaart enkel product + aantal en joint live met `products`,
 * zodat een lijstje altijd de actuele catalogus toont (i.t.t. `orderItems`,
 * die bewust een snapshot bevriezen — zie schema/orders.ts).
 */
export const savedLists = pgTable(
  "saved_lists",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("saved_lists_user_id_idx").on(table.userId)],
);

export const savedListItems = pgTable(
  "saved_list_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    listId: uuid()
      .notNull()
      .references(() => savedLists.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Opnieuw toevoegen van een product aan een lijst = update, geen dubbele rij.
    uniqueIndex("saved_list_items_list_product_idx").on(
      table.listId,
      table.productId,
    ),
  ],
);

export const savedListsRelations = relations(savedLists, ({ many }) => ({
  items: many(savedListItems),
}));

export const savedListItemsRelations = relations(
  savedListItems,
  ({ one }) => ({
    list: one(savedLists, {
      fields: [savedListItems.listId],
      references: [savedLists.id],
    }),
    product: one(products, {
      fields: [savedListItems.productId],
      references: [products.id],
    }),
  }),
);

export type SavedList = typeof savedLists.$inferSelect;
export type NewSavedList = typeof savedLists.$inferInsert;
export type SavedListItem = typeof savedListItems.$inferSelect;
export type NewSavedListItem = typeof savedListItems.$inferInsert;
