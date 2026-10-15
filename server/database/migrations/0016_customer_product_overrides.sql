CREATE TABLE "customer_product_overrides" (
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"included" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_product_overrides_customer_id_product_id_pk" PRIMARY KEY("customer_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "customer_product_overrides" ADD CONSTRAINT "customer_product_overrides_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_product_overrides" ADD CONSTRAINT "customer_product_overrides_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_product_overrides_product_id_idx" ON "customer_product_overrides" USING btree ("product_id");