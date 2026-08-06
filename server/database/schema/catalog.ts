import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Productcatalogus — de database-versie van app/data/categories.ts
 * en app/data/products.ts.
 */

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Zakelijke code uit het bestelsysteem, bv. "10", "15". */
    code: text().notNull(),
    /** URL-vriendelijke naam, bv. "salamis". */
    slug: text().notNull(),
    name: text().notNull(),
    emoji: text(),
    /** Volgorde in de sidebar; lager = hoger in de lijst. */
    sortOrder: integer().default(0).notNull(),
  },
  (table) => [
    uniqueIndex("categories_code_idx").on(table.code),
    uniqueIndex("categories_slug_idx").on(table.slug),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Artikelnummer van de leverancier — de natuurlijke sleutel. */
    articleNr: text().notNull(),
    name: text().notNull(),
    supplier: text().notNull(),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    /** Verpakkingsinfo: gewicht, stuks of afmetingen (bv. "15x140gr."). */
    unit: text(),
    /** Optionele URL naar een productfiche (PDF) van de producent. */
    infoPdf: text(),
    /** Uit het assortiment gehaald? Dan false i.p.v. verwijderen. */
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("products_article_nr_idx").on(table.articleNr),
    index("products_category_id_idx").on(table.categoryId),
  ],
);

/**
 * Relaties zijn puur voor de type-safe `db.query`-API van Drizzle.
 * Ze maken zelf geen kolommen aan — de foreign key hierboven doet dat.
 */
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

/** Rij zoals je die uit de database leest. */
export type Product = typeof products.$inferSelect;
/** Rij zoals je die erin schrijft (defaults zijn optioneel). */
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
