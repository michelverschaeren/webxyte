import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, orderItems, orders, user } from "~~/server/database/schema";
import type { BillingSnapshot } from "~~/server/database/schema";
import { generateOrderPdf, orderPdfFilename } from "~~/server/utils/order-pdf";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * GET /api/admin/orders/:id/pdf — de bestelbon zoals hij als bijlage bij de
 * bestelmail zat, opnieuw opgebouwd uit de bevroren bestelling (klantgegevens,
 * regels en promoties van op het moment van bestellen).
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: { orderBy: orderItems.createdAt } },
  });

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bestelling niet gevonden.",
    });
  }

  const [[account], [crmCustomer]] = await Promise.all([
    db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, order.userId))
      .limit(1),
    db
      .select({ customerNr: customers.customerNr })
      .from(customers)
      .where(eq(customers.userId, order.userId))
      .limit(1),
  ]);

  const billing = order.billingSnapshot as BillingSnapshot;
  const customerNr = crmCustomer?.customerNr ?? null;

  const pdf = await generateOrderPdf({
    order,
    billing,
    customerNr,
    // Zoals in de mail: het e-mailadres van de login.
    customerEmail: account?.email ?? billing.invoiceEmail,
    items: order.items,
  });

  const filename = orderPdfFilename(order, customerNr).replace(/[^\w.-]/g, "_");
  setHeader(event, "content-type", "application/pdf");
  setHeader(event, "content-length", pdf.length);
  setHeader(event, "content-disposition", `attachment; filename="${filename}"`);
  // Klant- en bestelgegevens: nooit in een gedeelde cache.
  setHeader(event, "cache-control", "private, no-store");
  setHeader(event, "x-robots-tag", "noindex, nofollow, noarchive");
  return Buffer.from(pdf);
});
