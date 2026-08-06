import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import type { auth } from "~~/server/utils/auth";

/**
 * De browser-kant van Better Auth. `inferAdditionalFields<typeof auth>()`
 * leest de server-config uit als *type* (wordt bij het bundelen weggestreept),
 * waardoor eigen velden zoals `role` ook in de frontend getypeerd zijn.
 *
 * Wordt door Nuxt automatisch geïmporteerd — je hoeft `authClient` nergens
 * handmatig te importeren.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut } = authClient;
