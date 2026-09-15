CREATE TABLE "customer_purchase_history" (
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"last_purchased_at" date NOT NULL,
	CONSTRAINT "customer_purchase_history_customer_id_product_id_pk" PRIMARY KEY("customer_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_nr" text NOT NULL,
	"name" text NOT NULL,
	"contact_email" text,
	"phone" text,
	"delivery_street" text,
	"delivery_postal_code" text,
	"delivery_city" text,
	"delivery_country" text DEFAULT 'België' NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_purchase_history" ADD CONSTRAINT "customer_purchase_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_purchase_history" ADD CONSTRAINT "customer_purchase_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_purchase_history_product_id_idx" ON "customer_purchase_history" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_customer_nr_idx" ON "customers" USING btree ("customer_nr");--> statement-breakpoint
CREATE INDEX "customers_user_id_idx" ON "customers" USING btree ("user_id");