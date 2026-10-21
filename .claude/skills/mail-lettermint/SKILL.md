---
name: mail-lettermint
description: Sending transactional email in a site from this starter via Lettermint (official SDK behind our own sendMail()). Use for any new or changed mail, server/utils/mail.ts, contact forms, "mail does not arrive", env vars LETTERMINT_* / MAIL_* / *_NOTIFICATION_EMAIL, or when someone suggests another provider (Resend, SendGrid, SMTP, nodemailer) or the nuxt-lettermint module.
---

# Email via Lettermint

**Agreement:** all transactional mail goes through Lettermint. Do not suggest
another provider or an SMTP library unless the user asks for it.

## Layers — only the bottom one knows Lettermint

1. **Mail functions / routes** (`server/api/contact.post.ts`, later
   `sendOrderMail`, `sendLoginLink`, …): recipient and content, built on the
   server. They call `sendMail()` only.
2. **`sendMail()`** in `server/utils/mail.ts`: sender, `MAIL_REDIRECT_TO`,
   timeout, tag, logging, error translation. Another provider = rewrite this
   function only.
3. **Official SDK `lettermint`** — version pinned exactly in `package.json`,
   zero dependencies (github.com/lettermint/lettermint-node).

## Rules

- **Never** `nuxt-lettermint` with `autoEndpoint` and never `useLettermint()`
  in the browser: the endpoint accepts `from`/`to`/`html` from anyone (open
  relay), and a mail built in the browser can be forged. Forms post only their
  fields to their own route; the server picks the recipient.
- **A mail never breaks the main action.** Store first, then mail in a
  `try/catch` that logs.
- Every mail has `text` **and** `html`; every user value in HTML goes through
  `escapeHtml()`. Inline CSS and tables only, no external CSS or scripts.
- `tag` per kind of mail (`[A-Za-z0-9_-]`); `idempotencyKey` for mails that must
  leave exactly once per event (`order:<id>`).
- `replyTo` = the person the mail is about (form sender, customer), so a reply
  reaches them, not the no-reply sender.
- Auth mails (login link, reset) answer the same for known and unknown
  addresses: never reveal which emails have an account.

## Env

| Var | Purpose |
|---|---|
| `LETTERMINT_API_TOKEN` | project sending token (`lm_…`), server only |
| `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | sender; domain verified in Lettermint |
| `CONTACT_NOTIFICATION_EMAIL` (+ others per site) | recipients — the **client's** addresses in production |
| `MAIL_REDIRECT_TO` | development + Preview only: all mail to the developer, real recipient in the subject. **Empty in production.** |

## New site or domain

- [ ] Add the domain in Lettermint; set SPF, DKIM (and return-path) DNS records.
- [ ] DMARC record on the domain (at least `p=none` with reporting).
- [ ] Token in Vercel Production; Preview only with `MAIL_REDIRECT_TO` set.
- [ ] Lettermint listed as processor in the privacy policy.
- [ ] One test mail per kind: arrives, not in spam, links work.

## Debugging

- Search the Vercel runtime logs for `[mail]`: `sent: <message_id>` → look the
  id up in Lettermint (delivered, bounced, blocked?); `failed:` → reason follows.
- `rejected (422 …)` with `errors.from` → sender domain not verified; other
  fields → invalid content (e.g. `text` under 3 characters).
- `HTTP 401/403` → wrong token, or a token from another project.
- Test the token without sending: `await Lettermint.email(token).ping()` → `"pong"`.
- Upgrading `lettermint`: read the changelog, re-check the error classes and
  the `send()` result (`message_id`, `status`), test ping / 422 / timeout.
