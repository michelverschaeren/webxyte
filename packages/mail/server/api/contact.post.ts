import { createRateLimiter } from '../utils/rate-limit'
import { escapeHtml, mailConfigured, sendMail } from '../utils/mail'

/**
 * POST /api/contact — the contact form. The browser sends only the form
 * fields; the server decides the recipient (CONTACT_NOTIFICATION_EMAIL) and
 * builds the mail. This replaces nuxt-lettermint's open `autoEndpoint`.
 *
 * Public endpoint, so two thresholds against spam: a hidden field only bots
 * fill in, and a limit per IP. The message is not stored anywhere.
 */

/** Per IP: 5 messages per 10 minutes. */
const rateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 })

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** One line, trimmed, capped: nothing that ends up in a subject may contain newlines. */
function line(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  const name = line(body?.name, 120)
  const email = line(body?.email, 200).toLowerCase()
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 5000) : ''
  if (!name || !EMAIL.test(email) || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Please fill in your name, a valid email address and a message.' })
  }

  // Honeypot: a bot gets the same answer as a human, but nothing is sent.
  if (line(body?.website, 200)) return { ok: true }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (rateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many messages. Please try again later.' })
  }

  const to = process.env.CONTACT_NOTIFICATION_EMAIL
  if (!mailConfigured() || !to) {
    console.info('[contact] Mail not configured; message from', email, '\n', message)
    throw createError({ statusCode: 503, statusMessage: 'The message could not be sent.' })
  }

  try {
    await sendMail({
      fromName: process.env.MAIL_FROM_NAME || 'Website',
      to,
      // Replying goes straight to the person who filled in the form.
      replyTo: email,
      subject: `Contact form — ${name}`,
      text: `${name} <${email}>\n\n${message}`,
      html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-line">${escapeHtml(message)}</p>`,
      tag: 'contact'
    })
  } catch (err) {
    console.error(err)
    throw createError({ statusCode: 503, statusMessage: 'The message could not be sent.' })
  }

  return { ok: true }
})
