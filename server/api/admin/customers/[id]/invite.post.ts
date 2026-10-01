import { z } from "zod";
import { inviteCustomer } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/customers/:id/invite — maakt de login van de klant aan
 * (met het contactadres) en mailt een uitnodiging. Bij een klant die al een
 * login heeft, gaat er gewoon een nieuwe uitnodiging uit.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  try {
    return await inviteCustomer(id);
  } catch (err) {
    // Validatiefouten (geen adres, adres in gebruik) gaan ongewijzigd door.
    if ((err as { statusCode?: number }).statusCode) throw err;
    console.error(`[admin] Uitnodiging voor klant ${id} mislukt:`, err);
    throw createError({
      statusCode: 502,
      statusMessage: "De uitnodiging kon niet verstuurd worden. Probeer het later opnieuw.",
    });
  }
});
