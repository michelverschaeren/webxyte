import { HttpRequestError, Lettermint, TimeoutError, ValidationError } from 'lettermint'

/**
 * Transactional email via Lettermint. The ONLY file that knows the provider:
 * pages and routes call the mail functions built on `sendMail()`, never the
 * SDK. Switching providers means rewriting `sendMail()` and nothing else.
 *
 * Why the official SDK (`lettermint`, pinned, zero dependencies) and not the
 * `nuxt-lettermint` module: the module's `autoEndpoint` accepts from/to/html
 * from any visitor — an open mail relay — and its client composable builds
 * the message in the browser. Mail content belongs on the server.
 */

/**
 * How long to wait for Lettermint. A form submit waits on the mail; a logged
 * error after 10 s beats a request hanging until Vercel kills the function.
 * (SDK default: 30 s.)
 */
const MAIL_TIMEOUT_MS = 10_000

export interface MailMessage {
  /** Sender display name; the address comes from MAIL_FROM_EMAIL. */
  fromName: string
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
  attachments?: MailAttachment[]
  /** Kind of mail ("contact", "order", …): filter in the Lettermint dashboard and in logs. `[A-Za-z0-9_-]` only. */
  tag: string
  /** Same key = Lettermint sends once, even if this call is retried (e.g. `order:<id>`). */
  idempotencyKey?: string
}

export interface MailAttachment {
  filename: string
  /** Raw bytes; base64-encoded here, as Lettermint expects. */
  content: Uint8Array
  contentType: string
}

/** Whether Lettermint is configured (token + sender). Without it: send nothing, only log. */
export function mailConfigured() {
  return Boolean(process.env.LETTERMINT_API_TOKEN && process.env.MAIL_FROM_EMAIL)
}

/**
 * Sends one email. Check `mailConfigured()` first; the caller decides what
 * happens without config. Throws an Error with the reason from Lettermint —
 * callers catch it, because a failed mail must never undo the main action
 * (store the submission/order first, mail second).
 */
export async function sendMail({
  fromName,
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
  tag,
  idempotencyKey
}: MailMessage) {
  // Locally and on Vercel Preview (a copy of production data, real people):
  // every mail goes to the developer, with the real recipient in the subject.
  const redirectTo = process.env.MAIL_REDIRECT_TO
  if (redirectTo) {
    subject = `[test → ${to}] ${subject}`
    to = redirectTo
    replyTo = undefined
  }

  let email = Lettermint.email(process.env.LETTERMINT_API_TOKEN!, { timeout: MAIL_TIMEOUT_MS })
    .from(`${fromName} <${process.env.MAIL_FROM_EMAIL}>`)
    .to(to)
    .subject(subject)
    .text(text)
    .tag(tag)
  if (html) email = email.html(html)
  if (replyTo) email = email.replyTo(replyTo)
  if (idempotencyKey) email = email.idempotencyKey(idempotencyKey)
  for (const a of attachments ?? []) {
    email = email.attach(a.filename, Buffer.from(a.content).toString('base64'), undefined, a.contentType)
  }

  try {
    const result = await email.send()
    console.info(`[mail] ${tag} sent: ${result.message_id} (${result.status})`)
  } catch (err) {
    throw new Error(`[mail] ${tag} failed: ${describeLettermintError(err)}`, { cause: err })
  }
}

/** One readable line for the logs, including what Lettermint itself answered. */
function describeLettermintError(err: unknown): string {
  if (err instanceof TimeoutError) return `no answer within ${MAIL_TIMEOUT_MS / 1000} s`
  if (err instanceof ValidationError) {
    return `rejected (422 ${err.errorType}): ${JSON.stringify(err.responseBody)}`
  }
  if (err instanceof HttpRequestError) {
    return `HTTP ${err.statusCode}: ${JSON.stringify(err.responseBody)}`
  }
  return err instanceof Error ? err.message : String(err)
}

/** Escape text for use in an HTML mail body (names, messages, …). */
export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}
