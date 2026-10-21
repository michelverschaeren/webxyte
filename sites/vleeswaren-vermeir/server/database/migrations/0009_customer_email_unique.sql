-- Eén klantnummer = één e-mailadres = één login.
--
-- 1) Drie CRM-paren deelden een adres. Bij telkens één klant wordt het
--    gewist (enkel als het nog hetzelfde adres is als bij de klant die het
--    houdt). Overzicht: old-data/klanten/dubbele-emails.md
--      100192 Het Paradijs        houdt het, gewist bij 100497 L'maturin
--      100402 Wolkenhoeve         houdt het, gewist bij 100431 Wolkenhoeve Puur Lokaal BV
--      100451 Brood en Banket Mertens bvba houdt het, gewist bij 100409 Fijngebak Harlekijn
UPDATE "customers" AS c SET "contact_email" = NULL
FROM "customers" AS keeper
WHERE (c."customer_nr", keeper."customer_nr") IN (('100497', '100192'), ('100431', '100402'), ('100409', '100451'))
  AND lower(c."contact_email") = lower(keeper."contact_email");--> statement-breakpoint
-- 2) Adressen voortaan in kleine letters, zoals Better Auth ze bewaart.
UPDATE "customers" SET "contact_email" = lower(trim("contact_email"))
WHERE "contact_email" IS NOT NULL AND "contact_email" <> lower(trim("contact_email"));--> statement-breakpoint
UPDATE "customers" SET "contact_email" = NULL WHERE "contact_email" = '';--> statement-breakpoint
-- 3) Een login die aan meerdere klanten hing, blijft enkel bij de klant met
--    het laagste klantnummer.
UPDATE "customers" AS c SET "user_id" = NULL
WHERE c."user_id" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "customers" AS other
    WHERE other."user_id" = c."user_id" AND other."customer_nr" < c."customer_nr"
  );--> statement-breakpoint
DROP INDEX "customers_user_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "customers_contact_email_idx" ON "customers" USING btree (lower("contact_email"));--> statement-breakpoint
CREATE UNIQUE INDEX "customers_user_id_idx" ON "customers" USING btree ("user_id");
