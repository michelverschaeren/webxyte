---
name: nuxt-image
description: "@nuxt/image (v2) in dit project op Vercel: NuxtImg/NuxtPicture, providers (vercel in productie, ipx lokaal), formaten, sizes, lazy loading, LCP-afbeeldingen en de oude /_ipx-URL's. Gebruik bij elke afbeelding in app/, bij NuxtImg, NuxtPicture, useImage of $img, bij trage of ontbrekende afbeeldingen, of bij wijzigingen aan de image-config in nuxt.config.ts."
---

# @nuxt/image in dit project

Bekijk bij twijfel de geïnstalleerde versie (`node_modules/@nuxt/image/package.json`)
en image.nuxt.com, of via de context7-MCP.

## Hoe het draait

- **Productie (Vercel):** @nuxt/image kiest zelf de provider `vercel`
  (`/_vercel/image?url=…&w=…&q=…`). Vercel doet de transformatie en de cache.
  Niets instellen.
- **Lokaal (`nuxt dev`):** provider `ipx` in de Nuxt-server (`/_ipx/...`).
  `image.ipx.maxAge` (1 jaar) geldt enkel daar.
- Globaal in `nuxt.config.ts`: `format: ["webp"]`, `quality: 80`.
- **Oude `/_ipx/...`-URL's** uit de VPS-tijd: `vercel.json` stuurt ze door
  naar het origineel (de IPX-handler crasht op Vercel). Die redirect laten
  staan; geen nieuwe `/_ipx`-links hardcoden.
- Bronbestanden staan in `public/images/` en worden zonder `public` als pad
  gebruikt: `src="/images/hero6.png"`.
- Vercel Image Optimization rekent per bronafbeelding. Gebruik `NuxtImg` niet
  voor kleine iconen of SVG's: daar volstaat een gewone `<img>`.

## Patroon

```vue
<NuxtImg
  src="/images/site/bestelwagens.jpeg"
  alt="Beschrijvende tekst (of alt=&quot;&quot; als het puur decoratief is)"
  width="1536"
  height="2048"
  sizes="sm:100vw md:50vw lg:600px"
  loading="lazy"
  format="webp"
  class="h-auto w-full object-cover"
/>
```

- **Altijd `width` en `height`**: de verhouding van de bron. Zo verspringt de
  layout niet (CLS). De echte weergavegrootte regelt CSS.
- **`sizes`** zodra de afbeelding kleiner getoond wordt dan haar bron. Zonder
  `sizes` krijgt een mobiel de volle breedte.
- **Valkuil:** elke `vw`-waarde in `sizes` moet een breakpoint-prefix hebben
  (`sm:100vw`, nooit los `100vw`). @nuxt/image leest een waarde zonder prefix
  als een scherm van 1 px breed: `sizes="100vw"` geeft een srcset van `1w, 2w`,
  en de afbeelding is kapot. Losse `px`-waarden (`105px sm:160px`) zijn wel in
  orde. Schrijf elk breakpoint uit waarvoor je een variant wil.
- **`loading="lazy"`** voor alles onder de vouw.
- **LCP-afbeelding** (hero bovenaan): géén `lazy`; wel `preload` en
  `fetchpriority="high"`. Maximaal één per pagina.
- Nieuwe bronbestanden niet groter dan nodig (max ±2000 px breed) en liefst
  al als JPG of WebP. Een bron-PNG van enkele MB vertraagt de eerste
  transformatie.

## Productfoto's en gevoelige beelden

Productgegevens zijn niet publiek (de catalogus is niet crawlbaar). Zet
geen productfoto's met fabrikant of artikelnr. in `public/` op een publieke
pagina, en niet in Schema.org of de sitemap.

## Controleren

- Lokaal: Network-tab → `/_ipx/...` met `200` en `image/webp`.
- Productie: `/_vercel/image?...` met `200`. Een gebroken afbeelding is vaak
  een pad dat niet in `public/` staat, of een externe host die niet in
  `image.domains` staat.
- `curl -sI "https://vleeswarenvermeir.be/_ipx/w_100/images/hero6.png"`
  moet `308` geven: de redirect werkt.
