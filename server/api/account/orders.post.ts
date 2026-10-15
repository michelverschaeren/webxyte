import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  billingDetails,
  customers,
  orderItems,
  orders,
  type BillingSnapshot,
} from "~~/server/database/schema";
import { promotionOutcome } from "#shared/promotion";
import { listAddresses } from "~~/server/utils/customer-addresses";
import { activePromotionsForUser } from "~~/server/utils/customer-promotions";
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
  /** Leveringsadres voor deze bestelling; zonder: het primaire adres. */
  addressId: z.uuid().optional(),
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

  const [[details], [crmCustomer]] = await Promise.all([
    db
      .select()
      .from(billingDetails)
      .where(eq(billingDetails.userId, user.id))
      .limit(1),
    db
      .select({
        id: customers.id,
        customerNr: customers.customerNr,
        name: customers.name,
        phone: customers.phone,
      })
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1),
  ]);

  // Het primaire adres staat eerst; de klant mag er in de bestelpopup een
  // ander van zichzelf kiezen.
  const addresses = crmCustomer ? await listAddresses(crmCustomer.id) : [];
  const address = body.addressId
    ? addresses.find((a) => a.id === body.addressId)
    : addresses[0];

  if (body.addressId && !address) {
    throw createError({
      statusCode: 400,
      statusMessage: "LEVERINGSADRES_ONBEKEND",
      message: "Dit leveringsadres bestaat niet meer.",
    });
  }

  // Facturatiegegevens zijn optioneel: wat de klant niet invulde, komt uit
  // het CRM en de login. Bestellen wordt er nooit door tegengehouden.
  const billing: BillingSnapshot = {
    companyName: details?.companyName ?? crmCustomer?.name ?? user.name,
    vatNumber: details?.vatNumber ?? null,
    phone: crmCustomer?.phone ?? null,
    invoiceEmail: details?.invoiceEmail ?? user.email,
    street: address?.street ?? null,
    postalCode: address?.postalCode ?? null,
    city: address?.city ?? null,
  };

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

  // Promoties die vandaag voor deze klant gelden, per regel bevroren op de
  // bestelling. Ter info voor de zaak (bestelmail, bestelbon, beheer) en de
  // klant (Mijn bestellingen); de webshop rekent zelf niets af.
  const promoByProduct = await activePromotionsForUser(
    user.id,
    requested.map((item) => byArticleNr.get(item.articleNr)!.id),
  );
  const lines = requested.map((item) => {
    const product = byArticleNr.get(item.articleNr)!;
    const promotions = (promoByProduct.get(product.id) ?? []).map((promo) => ({
      label: promo.label,
      ...promotionOutcome(promo, item.quantity),
    }));
    return {
      productId: product.id,
      articleNr: product.articleNr,
      name: product.name,
      supplier: product.supplier,
      unit: product.unit,
      quantity: item.quantity,
      promotions: promotions.length > 0 ? promotions : null,
    };
  });

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
      lines.map((line) => ({ orderId: created!.id, ...line })),
    );

    return created!;
  });

  // De bestelling staat vast; een mislukte mail mag dat niet ongedaan maken.
  try {
    await sendOrderNotification({
      order,
      billing,
      items: lines,
      customerEmail: user.email,
      customerNr: crmCustomer?.customerNr ?? null,
    });
  } catch (err) {
    console.error("[orders] e-mailnotificatie mislukt:", err);
  }

  setResponseStatus(event, 201);
  return { id: order.id };
});
