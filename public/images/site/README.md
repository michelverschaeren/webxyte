# Sfeerfoto's van de homepage

De bestanden hier zijn **tijdelijke stockfoto's** (Unsplash) die de plaats
innemen van echte foto's van Vleeswaren Vermeir. Ze staan lokaal in plaats van
op `images.unsplash.com` omdat een externe origin een extra DNS- en
TLS-handshake kostte op het kritieke pad, bovenop ~938 kB aan te grote
afbeeldingen.

## Een foto vervangen

Zet het nieuwe bestand **onder dezelfde naam** in deze map. Meer is niet nodig:
de componenten verwijzen naar het pad, en `@nuxt/image` maakt bij het bouwen
zelf de webp-varianten in alle nodige breedtes.

Twee dingen die wél moeten kloppen:

1. **Minstens zo breed als de kolom "min. breedte"** hieronder. Dat is de
   grootste variant die in de `srcset` terechtkomt; is de bron kleiner, dan
   schaalt IPX op en wordt het resultaat zacht.
2. **Ongeveer dezelfde verhouding.** Alle foto's staan in een `object-cover`-
   kader, dus een sterk afwijkende verhouding wordt bijgesneden — een portret
   waar een liggende foto hoort, verliest kop en staart.

| Bestand | Waar | Verhouding van het kader | Min. breedte |
|---|---|---|---|
| `eigenaars.jpg` | [AboutSection](../../../app/components/dm/AboutSection.vue) | 4:5 staand | 1536 px |
| `premium-vlees.jpg` | [QualitySection](../../../app/components/dm/QualitySection.vue) | vrij (eigen verhouding) | 1536 px |
| `chauffeur.jpg` | [DeliverySection](../../../app/components/dm/DeliverySection.vue) | staand, bijgesneden tot een liggend kader | 1536 px |
| `verse-steak.jpg` | [SplitSection](../../../app/components/dm/SplitSection.vue) — grote tegel | ~1:1 | 968 px |
| `gegrilde-steak.jpg` | SplitSection kleine tegel **én** StepsSection stap 01 | ~1:1 en 4:3 | 1280 px |
| `vlees-product.jpg` | SplitSection — kleine tegel | ~1:1 | 476 px |
| `verwerken.jpg` | [StepsSection](../../../app/components/dm/StepsSection.vue) — stap 02 | 4:3 liggend | 1280 px |
| `levering.jpg` | StepsSection — stap 03 | 4:3 liggend | 1280 px |
| `nalevering.jpg` | StepsSection — stap 04 | 4:3 liggend | 1280 px |

> `gegrilde-steak.jpg` wordt op twee plaatsen getoond, in twee verschillende
> verhoudingen. Wil je daar twee verschillende foto's, splits hem dan eerst in
> twee bestanden en pas het pad aan in `StepsSection.vue`.

## Wat je níét hoeft te doen

- **Niet vooraf verkleinen of naar webp omzetten.** Lever de grootste versie
  die je hebt; `@nuxt/image` doet de rest. Handmatig verkleind materiaal
  levert alleen maar een slechtere bron voor de grote varianten op.
- **Geen `loading`, `sizes` of `quality` aanpassen.** Die staan al afgestemd op
  de plek waar de foto getoond wordt.

## Controleren na het vervangen

```bash
pnpm build && pnpm start
```

Open de homepage, en kijk in DevTools → Network → Img of de opgehaalde breedte
in de buurt ligt van de weergegeven breedte. Wijkt dat een factor twee af, dan
klopt de `sizes` in het betreffende component niet meer.
