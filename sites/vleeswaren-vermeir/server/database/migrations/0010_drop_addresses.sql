ALTER TABLE "billing_details" DROP COLUMN "street";--> statement-breakpoint
ALTER TABLE "billing_details" DROP COLUMN "postal_code";--> statement-breakpoint
ALTER TABLE "billing_details" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "billing_details" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "delivery_street";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "delivery_postal_code";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "delivery_city";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "delivery_country";