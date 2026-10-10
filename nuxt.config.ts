import tailwindcss from "@tailwindcss/vite";
import { COMPANY } from "./shared/company";

// Wat crawlers niet mogen ophalen en dus ook niet in de sitemap of llms.txt
// hoort. Naast de klanten- en beheerpagina's (achter login/rol) gaat het om
// de bestelomgeving en de product-API: daar staat per product de fabrikant
// bij, en wie welk product levert is bedrijfsgevoelig.
//
// Let op: dit houdt alleen zoekmachines en AI-bots uit die robots.txt
// respecteren. Het is geen toegangsbeveiliging — zie /api/products.
const BLOCKED_PATHS = [
  "/account",
  "/account/**",
  "/admin",
  "/admin/**",
  "/producten",
  "/producten/**",
  "/api/**",
  // Productfiches (PDF) van de fabrikanten, per artikelnummer.
  "/docs/**",
];

// Crawlers van AI-zoekmachines en -assistenten. Zonder eigen groep vallen ze
// onder `User-agent: *`, dus wie hier staat is toegelaten; de groep maakt dat
// expliciet. Een bot met een eigen groep negeert `*` volledig — de geblokkeerde
// paden moeten hier dus opnieuw in.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

// Content-Security-Policy: beperkt waar de pagina scripts, stijlen, beelden en
// frames mag ophalen en waarheen ze data mag sturen. Alles komt van de eigen
// origin; de enige uitzondering is de Google Maps-kaart op de contactpagina.
//
// `'unsafe-inline'` blijft nodig: Nuxt zet zijn opstartscript en het
// thema-script inline in de HTML, en de componenten gebruiken inline styles.
// Een nonce per request zou dat strenger maken, maar vergt een extra module.
//
// Enkel in productie: de dev-server (Vite-HMR, devtools) heeft websockets en
// scripts van andere origins nodig.
const CONTENT_SECURITY_POLICY =
  process.env.NODE_ENV === "production"
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-src 'self' https://www.google.com",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; ")
    : null;

export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },

  modules: [
    "@nuxt/image",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxtjs/seo",
    "@vercel/analytics",
    "@vercel/speed-insights",
  ],

  // Zelf-gehoste fonts i.p.v. de render-blokkerende stylesheet van Google:
  // die kostte twee extra origins (preconnect naar fonts.googleapis.com én
  // fonts.gstatic.com) vóór er ook maar één letter op het scherm stond. De
  // @font-face-regels komen nu inline in de HTML, met unicode-range, dus de
  // browser haalt enkel de latijnse subset op.
  //
  // De gewichten hieronder zijn precies wat de componenten gebruiken (900 en
  // 600 zitten niet in de default 400/700 van de module). Geen italic: de
  // oude Google-URL vroeg Playfair-italic op, maar die staat nergens in de
  // templates; de enige cursieve tekst is Dancing Script, en daarvan bestaat
  // bij Google geen echte italic — die werd altijd al synthetisch schuin
  // gezet. Italic schrappen scheelt 12 @font-face-regels op élke pagina.
  fonts: {
    families: [
      {
        name: "Playfair Display",
        provider: "google",
        weights: [400, 700, 900],
        styles: ["normal"],
      },
      {
        name: "Dancing Script",
        provider: "google",
        weights: [400, 600, 700],
        styles: ["normal"],
      },
    ],
  },

  // Basisgegevens voor de hele "Nuxt SEO"-suite (sitemap, robots.txt,
  // canonical URLs, Schema.org, OG-afbeeldingen, …) — zonder `site.url`
  // kunnen die geen absolute URL's opbouwen.
  site: {
    url: "https://vleeswarenvermeir.be",
    name: "Vleeswaren Vermeir",
    description:
      "Vleeswaren Vermeir levert meer dan 5000 vleeswaren aan handelaars in België. Familiebedrijf in Zemst met persoonlijke service en breed gamma.",
    defaultLocale: "nl-BE",
  },

  // Zet het bedrijf als Schema.org LocalBusiness — voedt Google's
  // Knowledge Panel / lokale zoekresultaten met adres, telefoon en logo
  // (dezelfde gegevens als op de contactpagina), en geeft AI-engines een
  // eenduidig antwoord op "wie is dit bedrijf en waar zit het".
  schemaOrg: {
    identity: {
      "@type": ["Organization", "LocalBusiness"],
      name: COMPANY.name,
      legalName: COMPANY.legalName,
      description:
        "Familiebedrijf in Zemst dat meer dan 5000 vleeswaren en aanverwante producten levert aan handelaars in België.",
      foundingDate: String(COMPANY.foundingYear),
      logo: "/images/logo-light.png",
      telephone: COMPANY.phoneIntl,
      email: COMPANY.email,
      address: {
        streetAddress: COMPANY.street,
        postalCode: COMPANY.postalCode,
        addressLocality: COMPANY.city,
        addressCountry: COMPANY.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: COMPANY.geo.latitude,
        longitude: COMPANY.geo.longitude,
      },
      areaServed: { "@type": "Country", name: "België" },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: COMPANY.phoneIntl,
          email: COMPANY.email,
          areaServed: "BE",
          availableLanguage: "nl",
        },
        {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: COMPANY.mobileIntl,
          areaServed: "BE",
          availableLanguage: "nl",
        },
        {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: COMPANY.mobile2Intl,
          areaServed: "BE",
          availableLanguage: "nl",
        },
      ],
    },
  },

  robots: {
    disallow: BLOCKED_PATHS,
    groups: [{ userAgent: AI_CRAWLERS, allow: ["/"], disallow: BLOCKED_PATHS }],
  },

  // Enkel de statische pagina's; producten en categorieën staan er bewust
  // niet in (de bestelomgeving is voor crawlers afgesloten).
  sitemap: {
    exclude: BLOCKED_PATHS,
  },

  // Standaard "ipx"-provider verwerkt afbeeldingen in de Nuxt-server zelf
  // (geen externe dienst nodig) — past bij de self-hosted Dokploy-setup.
  image: {
    format: ["webp"],
    quality: 80,

    // IPX zet standaard `max-age=60`: elke bezoeker lokte na een minuut een
    // verse transform van een bron-PNG van megabytes uit (gemeten TTFB tot
    // ~1 s op de hero). Elke /_ipx-URL draagt zijn transformatie in het pad,
    // dus een andere variant is per definitie een andere URL — veilig om een
    // jaar te bewaren. Dit kan niet via `routeRules`: de IPX-handler zet de
    // header zelf, vóór Nitro's route-headers erop komen.
    ipx: {
      maxAge: 60 * 60 * 24 * 365,
    },
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    // Server-only. Leeg laten: wordt gevuld vanuit .env / Dokploy env-vars.
    // NUXT_DATABASE_URL en NUXT_BETTER_AUTH_SECRET overschrijven deze.
    databaseUrl: "",
    betterAuthSecret: "",
    betterAuthUrl: "",
  },

  routeRules: {
    // Basis response-headers voor de hele site.
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        // SAMEORIGIN en niet DENY: de productfiche opent in een iframe op de
        // eigen site (ProductInfoModal). Andere sites mogen ons niet inlijsten.
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        // Genegeerd door browsers over http, dus onschadelijk in lokale dev.
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        ...(CONTENT_SECURITY_POLICY
          ? { "Content-Security-Policy": CONTENT_SECURITY_POLICY }
          : {}),
      },
    },

    // Bestanden uit public/ hebben geen hash in hun naam en kunnen dus wél
    // wijzigen onder dezelfde URL — een maand cache, maar geen `immutable`.
    "/images/**": {
      headers: { "cache-control": "public, max-age=2592000" },
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: "nl-BE",
      },
      script: [
        {
          // Zet `data-theme` nog vóór de eerste paint, zodat een bezoeker met
          // het donkere thema geen lichte flits ziet. Moet inline en blokkerend
          // zijn: een extern of `defer`-script draait pas na de eerste paint.
          // Bewust piepklein gehouden — dit staat op het kritieke pad.
          // Licht is de default: enkel een bewaarde keuze "dark" wijkt af.
          innerHTML:
            "var t='light';try{if(localStorage.getItem('theme')==='dark')t='dark'}catch(e){}document.documentElement.dataset.theme=t",
          tagPosition: "head",
        },
      ],
    },
  },

  nitro: {
    // Comprimeert alles onder .output/public (JS, CSS, fonts) tijdens de build
    // en serveert de .br/.gz-variant op basis van Accept-Encoding. Dat is de
    // helft van het compressieverhaal die zónder proxy-wijziging kan: brotli
    // op maximale kwaliteit, één keer betaald bij het bouwen in plaats van
    // bij elke request.
    //
    // De SSR-HTML valt hier NIET onder — die wordt per request gerenderd en
    // kan enkel door Traefik gecomprimeerd worden (zie README/Dokploy).
    compressPublicAssets: { gzip: true, brotli: true },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
