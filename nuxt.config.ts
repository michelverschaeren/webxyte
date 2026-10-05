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
  "/toegang/**",
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

export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

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

    // ── ZET DIT OP `true` (OF VERWIJDER DE REGEL) BIJ LIVEGANG ──────────────
    // Zolang de "website in aanbouw"-poort aan staat, blokkeert dit de hele
    // site voor zoekmachines en AI-bots: robots.txt wordt "Disallow: /", elke
    // pagina krijgt `noindex` (meta + X-Robots-Tag) en /llms.txt geeft 404.
    // Zonder deze regel zou de productiesite wél geïndexeerd worden.
    // Zonder rebuild kan het ook via de env-var NUXT_SITE_INDEXABLE=true.
    indexable: false,
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

    public: {
      // Wachtwoord voor de "website in aanbouw"-toegangspoort.
      // Overschrijf via .env met NUXT_PUBLIC_SITE_PASSWORD=jouw-wachtwoord
      sitePassword: "vermeir2026",

      // Eenmalige toegangslink voor een specifieke klant: /toegang/<token>
      // omzeilt de site-lock zonder het algemene wachtwoord te delen. Leeg
      // laten = link staat uit. Zet via .env met
      // NUXT_PUBLIC_CUSTOMER_ACCESS_TOKEN=een-lang-willekeurig-token
      customerAccessToken: "",
    },
  },

  routeRules: {
    // Basis response-headers voor de hele site. Geen CSP hier: dat vergt
    // uitgebreide browser-tests tegen Vite-HMR en wordt best apart aangepakt.
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
          // het lichte thema geen donkere flits ziet. Moet inline en blokkerend
          // zijn: een extern of `defer`-script draait pas na de eerste paint.
          // Bewust piepklein gehouden — dit staat op het kritieke pad.
          innerHTML:
            "try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){}",
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
