import { bigint, boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Tabellen die Better Auth verwacht (core schema, v1.6).
 * De namen van de tabellen én de kolommen liggen vast — Better Auth
 * mapt hierop via de drizzleAdapter. Voeg gerust extra kolommen toe
 * (zie `role` hieronder), maar hernoem de bestaande niet.
 */

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),

  // Eigen uitbreiding: onderscheid tussen klant en beheerder.
  // Moet ook in server/utils/auth.ts onder `user.additionalFields` staan.
  role: text({ enum: ["customer", "admin"] }).default("customer").notNull(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  token: text().notNull().unique(),
  expiresAt: timestamp().notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  /** Alleen gevuld bij e-mail/wachtwoord-login (scrypt hash). */
  password: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Tellers van Better Auth's rate limiter (`rateLimit.storage: "database"`).
 * In de database i.p.v. in het geheugen, zodat alle Vercel-instanties
 * dezelfde stand zien. Better Auth ruimt verlopen rijen zelf op.
 */
export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  /** IP + pad, bv. "1.2.3.4/sign-in/email". */
  key: text().notNull().unique(),
  count: integer().notNull(),
  /** Tijdstip van de laatste aanvraag in ms sinds epoch (Date.now()). */
  lastRequest: bigint({ mode: "number" }).notNull(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
