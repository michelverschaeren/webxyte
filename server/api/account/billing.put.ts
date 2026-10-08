import { z } from "zod";
import { db } from "~~/server/database/client";
import { billingDetails } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/**
 * PUT /api/account/billing — facturatiegegevens opslaan. Eén profiel per
 * klant: bestaat er al een rij, dan wordt die bijgewerkt.
 */
const bodySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(40).optional(),
  invoiceEmail: z.email().max(200),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const values = {
    ...body,
    phone: body.phone || null,
    userId: user.id,
  };

  const [details] = await db
    .insert(billingDetails)
    .values(values)
    .onConflictDoUpdate({
      target: billingDetails.userId,
      set: {
        companyName: values.companyName,
        phone: values.phone,
        invoiceEmail: values.invoiceEmail,
      },
    })
    .returning();

  return details;
});
