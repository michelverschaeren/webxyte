import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  modules: ["@nuxt/image", "@nuxt/eslint", "@nuxt/fonts", "@nuxtjs/seo"],

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

  // Klanten- en beheerpagina's zijn achter login/rol beveiligd — ze horen
  // niet in de sitemap, robots.txt-indexering of llms.txt te staan.
  robots: {
    disallow: ["/account", "/account/**", "/admin", "/admin/**"],
  },

  // Geen expliciete provider: @nuxt/image detecteert Vercel bij een deploy en
  // schakelt zelf over naar /_vercel/image. Lokaal blijft het de ingebouwde
  // ipx-provider (die de vercel-provider niet kan draaien — /_vercel/image
  // bestaat enkel op Vercel zelf en geeft in dev gebroken afbeeldingen).
  image: {
    format: ["webp"],
    quality: 80,

    // IPX zet standaard `max-age=60`. Elke /_ipx-URL draagt zijn transformatie
    // in het pad, dus een andere variant is per definitie een andere URL —
    // veilig om een jaar te bewaren. Dit kan niet via `routeRules`: de
    // IPX-handler zet de header zelf, vóór Nitro's route-headers erop komen.
    // Raakt op Vercel niets: daar loopt het via /_vercel/image.
    ipx: {
      maxAge: 60 * 60 * 24 * 365,
    },
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    // Server-only. Leeg laten: wordt gevuld vanuit .env / de Environment
    // Variables van het Vercel-project. Let op: de server-code leest deze
    // waarden rechtstreeks via process.env.DATABASE_URL en
    // process.env.BETTER_AUTH_SECRET, dus zet in Vercel de KALE namen —
    // niet de NUXT_-prefix die runtimeConfig hier zou vullen.
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

  // Geen `nitro.compressPublicAssets` meer: dat was nodig omdat Traefik op de
  // Dokploy-VPS niets comprimeerde. Vercel's CDN comprimeert statische assets
  // én de SSR-HTML zelf met brotli, dus de build-tijd-compressie leverde daar
  // enkel dubbel werk en een tragere build op.

  vite: {
    plugins: [tailwindcss()],
  },
});