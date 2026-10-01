import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  billingDetails,
  customers,
  orderItems,
  orders,
} from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/**
 * POST /api/account/orders — bestelling plaatsen vanuit het winkelmandje.
 *
 * De client stuurt alleen articleNr + aantal — nooit een database-id, die kan
 * verzonnen of verouderd zijn. Naam, leverancier en verpakking haalt de
 * server zelf uit de catalogus (via het artikelnummer) en bevriest ze op de
 * bestelregel.
 */
const bodySchema = z.object({
  name: z.string().trim().max(200).optional(),
  note: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        articleNr: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(9999),
      }),
    )
    .min(1)
    .max(500),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));
  const requested = mergeQuantitiesByArticleNr(body.items);

  const [billing] = await db
    .select()
    .from(billingDetails)
    .where(eq(billingDetails.userId, user.id))
    .limit(1);

  if (!billing) {
    throw createError({
      statusCode: 422,
      statusMessage: "FACTURATIEGEGEVENS_ONTBREKEN",
      message: "Vul eerst uw facturatiegegevens in.",
    });
  }

  const byArticleNr = await resolveProductsByArticleNr(
    requested.map((i) => i.articleNr),
  );
  const unavailable = requested.filter(
    (i) => !byArticleNr.get(i.articleNr)?.isActive,
  );

  if (unavailable.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: "PRODUCTEN_NIET_BESCHIKBAAR",
      message: "Sommige artikelen zijn niet meer beschikbaar.",
      data: {
        articleNrs: unavailable.map((i) => i.articleNr),
        names: unavailable.map(
          (i) => byArticleNr.get(i.articleNr)?.name ?? "Onbekend artikel",
        ),
      },
    });
  }

  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        userId: user.id,
        billingSnapshot: billing,
        name: body.name || null,
        note: body.note || null,
      })
      .returning();

    await tx.insert(orderItems).values(
      requested.map((item) => {
        const product = byArticleNr.get(item.articleNr)!;
        return {
          orderId: created!.id,
          productId: product.id,
          articleNr: product.articleNr,
          name: product.name,
          supplier: product.supplier,
          unit: product.unit,
          quantity: item.quantity,
        };
      }),
    );

    return created!;
  });

  // De bestelling staat vast; een mislukte mail mag dat niet ongedaan maken.
  try {
    // Eén login kan aan meerdere CRM-klanten hangen; de bon toont ze allemaal.
    const crmCustomers = await db
      .select({ customerNr: customers.customerNr })
      .from(customers)
      .where(eq(customers.userId, user.id))
      .orderBy(asc(customers.customerNr));

    await sendOrderNotification({
      order,
      billing,
      items: requested.map((item) => {
        const product = byArticleNr.get(item.articleNr)!;
        return {
          articleNr: product.articleNr,
          name: product.name,
          supplier: product.supplier,
          unit: product.unit,
          quantity: item.quantity,
        };
      }),
      customerEmail: user.email,
      customerNrs: crmCustomers.map((c) => c.customerNr),
    });
  } catch (err) {
    console.error("[orders] e-mailnotificatie mislukt:", err);
  }

  setResponseStatus(event, 201);
  return { id: order.id };
});
