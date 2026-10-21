// @webxyte/mail — transactional mail via Lettermint.
//
// Provides server/utils/mail.ts (sendMail, mailConfigured, escapeHtml),
// server/utils/rate-limit.ts and the public contact route POST /api/contact.
// A site that needs its own contact route (other fields, other mail) puts a
// server/api/contact.post.ts in the site: the site wins.
//
// Env: LETTERMINT_API_TOKEN, MAIL_FROM_EMAIL, MAIL_FROM_NAME,
// CONTACT_NOTIFICATION_EMAIL, MAIL_REDIRECT_TO (dev + Preview only).
// Skill: mail-lettermint. Never use nuxt-lettermint's autoEndpoint (open relay).
export default defineNuxtConfig({
  $meta: { name: 'mail' }
})
