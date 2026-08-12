import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  modules: ["@nuxt/image", "@nuxt/eslint", "@nuxtjs/seo"],

  // Basisgegevens voor de hele "Nuxt SEO"-suite (sitemap, robots.txt,
  // canonical URLs, Schema.org, OG-afbeeldingen, …) — zonder `site.url`
  // kunnen die geen absolute URL's opbouwen.
  site: {
    url: "https://vleeswaren.webxyte.be",
    name: "Vleeswaren Vermeir",
    description:
      "Vleeswaren Vermeir levert meer dan 5000 vleeswaren aan handelaars in België. Familiebedrijf in Zemst met persoonlijke service en breed gamma.",
    defaultLocale: "nl-BE",
  },

  // Zet het bedrijf als Schema.org LocalBusiness — voedt Google's
  // Knowledge Panel / lokale zoekresultaten met adres, telefoon en logo
  // (dezelfde gegevens als op de contactpagina).
  schemaOrg: {
    identity: {
      "@type": ["Organization", "LocalBusiness"],
      name: "Vleeswaren Vermeir",
      logo: "/images/logo-light.png",
      telephone: "+32 15 61 15 39",
      email: "vleeswarenvermeir@telenet.be",
      address: {
        streetAddress: "Schoolstraat 51",
        postalCode: "1980",
        addressLocality: "Zemst",
        addressCountry: "BE",
      },
    },
  },

  // Klanten- en beheerpagina's zijn achter login/rol beveiligd, en het
  // winkelmandje heeft geen unieke content — ze horen niet in de sitemap,
  // robots.txt-indexering of llms.txt te staan.
  robots: {
    disallow: ["/account", "/account/**", "/admin", "/admin/**", "/winkelmandje"],
  },

  // Standaard "ipx"-provider verwerkt afbeeldingen in de Nuxt-server zelf
  // (geen externe dienst nodig) — past bij de self-hosted Dokploy-setup.
  image: {
    format: ["webp"],
    quality: 80,
  },

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

  routeRules: {
    // Basis response-headers voor de hele site. Geen CSP hier: dat vergt
    // uitgebreide browser-tests tegen Google Fonts/naive-ui/Vite-HMR en
    // wordt best apart aangepakt.
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        // Genegeerd door browsers over http, dus onschadelijk in lokale dev.
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: "nl-BE",
      },
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/images/favicon.png",
        },
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