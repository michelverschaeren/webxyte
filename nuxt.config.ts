import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    // Server-only. Leeg laten: wordt gevuld vanuit .env / Dokploy env-vars.
    // NUXT_DATABASE_URL en NUXT_BETTER_AUTH_SECRET overschrijven deze.
    databaseUrl: "",
    betterAuthSecret: "",
    betterAuthUrl: "",

    public: {
      // Wachtwoord voor de "website in aanbouw"-toegangspoort.
      // Overschrijf via .env met NUXT_PUBLIC_SITE_PASSWORD=jouw-wachtwoord
      sitePassword: "vermeir2026",
    },
  },

  app: {
    head: {
      link: [
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Dancing+Script:wght@400;600;700&display=swap",
        },
      ],
    },
  },

  build: {
    transpile: [
      "naive-ui",
      "vueuc",
      "@css-render/vue3-ssr",
      "@juggle/resize-observer",
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["naive-ui", "vueuc"],
    },
  },
});
