import * as Sentry from "@sentry/nuxt";

// Niet dezelfde code als sentry.client.config.ts: dit bestand laadt vóór
// useRuntimeConfig() beschikbaar is, dus de DSN zou stil op undefined
// uitkomen en server-side fouten zouden nooit gerapporteerd worden.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0, // enkel foutmeldingen — geen performance tracing
  sendDefaultPii: false,
});
