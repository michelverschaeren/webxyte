import { auth } from "~~/server/utils/auth";

/**
 * Eén catch-all route die álle Better Auth endpoints afhandelt:
 * /api/auth/sign-in/email, /api/auth/sign-up/email, /api/auth/get-session,
 * /api/auth/sign-out, OAuth-callbacks, enzovoort.
 *
 * Better Auth werkt met de web-standaard Request/Response; `toWebRequest`
 * vertaalt het Nitro-event daarnaartoe.
 */
export default defineEventHandler((event) => auth.handler(toWebRequest(event)));
