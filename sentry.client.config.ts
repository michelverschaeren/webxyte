import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: useRuntimeConfig().public.sentryDsn,
  tracesSampleRate: 0, // enkel foutmeldingen — geen performance tracing
  sendDefaultPii: false,
});
