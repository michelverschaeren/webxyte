CREATE TABLE "promotion_customers" (
	"promotion_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	CONSTRAINT "promotion_customers_promotion_id_customer_id_pk" PRIMARY KEY("promotion_id","customer_id")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"percentage" numeric(5, 2),
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"buy_quantity" integer,
	"free_quantity" integer,
	"price" numeric(10, 2),
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"all_customers" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_period_check" CHECK ("promotions"."ends_on" >= "promotions"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "promotion_customers" ADD CONSTRAINT "promotion_customers_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_customers" ADD CONSTRAINT "promotion_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promotion_customers_customer_id_idx" ON "promotion_customers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "promotions_product_id_idx" ON "promotions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "promotions_period_idx" ON "promotions" USING btree ("starts_on","ends_on");