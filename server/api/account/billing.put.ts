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
  vatNumber: z.string().trim().max(32).optional().or(z.literal("")),
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(16),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120).default("België"),
  phone: z.string().trim().min(1).max(40),
  invoiceEmail: z.email().max(200),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const values = {
    ...body,
    vatNumber: body.vatNumber?.trim() ? body.vatNumber.trim() : null,
    userId: user.id,
  };

  const [details] = await db
    .insert(billingDetails)
    .values(values)
    .onConflictDoUpdate({
      target: billingDetails.userId,
      set: {
        companyName: values.companyName,
        vatNumber: values.vatNumber,
        street: values.street,
        postalCode: values.postalCode,
        city: values.city,
        country: values.country,
        phone: values.phone,
        invoiceEmail: values.invoiceEmail,
      },
    })
    .returning();

  return details;
});
