<template>
  <section class="py-24 bg-(--color-bg)">
    <div class="max-w-300 mx-auto px-6">
      <div class="text-center mb-12">
        <p
          class="uppercase tracking-[0.3em] text-[0.75rem] text-(--color-accent) font-semibold mb-4"
        >
          — Uitgebreid gamma —
        </p>
        <h2
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] font-bold text-(--color-text-strong) mb-4 leading-[1.1]"
        >
          <span class="block">Van fijne vleeswaren tot</span>
          <span
            class="block font-['Dancing_Script',cursive] text-[#b8252a] font-normal text-[1.1em] mt-2"
            >bereide gerechten</span
          >
        </h2>
        <p
          class="max-w-150 mx-auto mt-6 text-(--color-text-muted) leading-[1.7] text-[1.05rem]"
        >
          Van sauzen tot verpakkingsmateriaal. Bij Vleeswaren Vermeir kan u
          terecht voor ieder product en met al uw vragen betreffende die
          producten.
        </p>
      </div>

      <!-- Rijen zijn los van elkaar gerasterd i.p.v. één grid van tien: op
           mobiel (3 kolommen) zou dat 3-3-3-1 worden, met een eenzame kaart
           onderaan. Zo houdt elke rij zijn eigen 3-2. -->
      <div class="space-y-4 sm:space-y-6">
        <div
          v-for="(row, rowIndex) in categoryRows"
          :key="rowIndex"
          class="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6"
        >
          <NuxtLink
            v-for="category in row"
            :key="category.name"
            :to="`/assortiment/${category.slug}`"
            class="group cursor-pointer text-center text-(--color-text-muted) transition-transform duration-300 hover:-translate-y-2"
          >
            <div
              class="relative mx-auto mb-4 flex h-32 w-full items-center justify-center sm:h-40"
            >
              <!-- Alleen zinvol achter een uitsnede; onder een dekkende foto
                   zou deze lichtplek toch onzichtbaar zijn. -->
              <span
                v-if="category.photo === 'cutout'"
                class="photo-glow"
                aria-hidden="true"
              />
              <!-- Getoond op ~105px (mobiel, 3 kolommen) tot ~215px (5 kolommen);
                   `sizes` houdt de srcset daar strak op, i.p.v. de rauwe PNG's
                   van 270 kB–3,5 MB die hier vroeger stonden. Het medaillon is
                   smaller dan de volle kolom, dus dat krijgt een eigen `sizes`. -->
              <NuxtImg
                :src="category.img"
                :alt="category.name"
                loading="lazy"
                format="webp"
                :sizes="
                  category.photo === 'framed' || category.photo === 'tile'
                    ? '105px sm:160px'
                    : '110px sm:220px'
                "
                class="relative transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-105"
                :class="{
                  'sketch-img h-full w-full object-contain': !category.photo,
                  'photo-img h-full w-full object-contain':
                    category.photo === 'cutout',
                  'photo-framed aspect-square h-auto w-full max-w-32 object-cover sm:max-w-40':
                    category.photo === 'framed',
                  'rounded-full':
                    category.photo === 'framed' && !category.squircle,
                  'rounded-3xl':
                    category.photo === 'framed' && category.squircle,
                  'photo-tile aspect-square h-auto w-full max-w-32 rounded-2xl object-contain p-3 sm:max-w-40 sm:p-4':
                    category.photo === 'tile',
                }"
              />
            </div>
            <p
              class="m-0 text-[0.75rem] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-(--color-accent)"
            >
              {{ category.name }}
            </p>
          </NuxtLink>
        </div>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/producten"
          class="inline-block rounded-xl border-2 border-[#c89868] text-(--color-accent) px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.8rem] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
          >Alle categorieën →</NuxtLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Absolute paden: relatieve src'en ("images/…") braken zodra deze sectie op
// een geneste route zou staan, en @nuxt/image vereist ze sowieso.
type Category = {
  name: string;
  img: string;
  slug: string;
  /**
   * Weglaten = lijntekening, die door het silhouetfilter gaat.
   * "cutout" = foto op transparantie: zweeft vrij, met een gloed eromheen.
   * "framed" = foto met eigen achtergrond: rond bijgesneden tot medaillon,
   *   want een slagschaduw zou hier de rechthoek natrekken i.p.v. het product.
   * "tile" = vierkant met afgeronde hoeken op een egale themavlak; de foto
   *   staat binnen de tegel (contain), zodat uitsneden niet tegen de rand
   *   lopen.
   */
  photo?: "cutout" | "framed" | "tile";
  /** Alleen bij "framed": afgerond vierkant i.p.v. cirkel (layout-test). */
  squircle?: boolean;
};

// Eén array per rij; het raster hangt aan de buitenste v-for.
const categoryRows: Category[][] = [
  [
    {
      name: "Salami",
      img: "/images/categorie/Worstwaren_foto.png",
      slug: "salamis",
      photo: "cutout",
    },
    {
      name: "Ham",
      img: "/images/categorie/Gevogelte_foto.png",
      slug: "hespen",
      photo: "cutout",
    },
    {
      name: "Kaas",
      img: "/images/categorie/salamis.png",
      slug: "kazen",
      photo: "framed",
      squircle: true,
    },
    {
      name: "Salades",
      img: "/images/categorie/salades.png",
      slug: "salades",
    },
    {
      name: "Bereide gerechten",
      img: "/images/categorie/lasagne.png",
      slug: "traiteur",
    },
  ],
  // Tweede rij: alles medaillon. De categorieën overlappen bewust niet met
  // rij 1, anders staat hetzelfde product er twee keer op.
  [
    {
      name: "Gevogelte",
      img: "/images/categorie/new/Gevogelte.png",
      slug: "gevogelte",
      photo: "framed",
    },
    {
      name: "Kookwaren",
      img: "/images/categorie/new/Kookwaren.png",
      slug: "kookwaren",
      photo: "framed",
    },
    {
      name: "Rookwaren",
      img: "/images/categorie/new/Rookwaren.jpg",
      slug: "rookwaren",
      photo: "framed",
    },
    {
      name: "Zoutwaren",
      img: "/images/categorie/new/Zoutwaren.png",
      slug: "zoutwaren",
      photo: "framed",
    },
    {
      name: "Paté",
      img: "/images/categorie/new/pate.png",
      slug: "pates",
      photo: "framed",
    },
  ],
  // Derde rij: layout-variant om te vergelijken — dezelfde foto's als hierboven,
  // maar als vierkante tegel op een egaal vlak. Bewust maar drie kaarten, de
  // twee resterende kolommen blijven leeg.
  [
    {
      name: "Salami",
      img: "/images/categorie/Worstwaren_foto.png",
      slug: "salamis",
      photo: "tile",
    },
    {
      name: "Ham",
      img: "/images/categorie/Gevogelte_foto.png",
      slug: "hespen",
      photo: "tile",
    },
    {
      name: "Paté",
      img: "/images/categorie/new/pate.png",
      slug: "pates",
      photo: "tile",
    },
  ],
];
</script>

<style scoped>
.sketch-img {
  filter: brightness(0) invert(1) opacity(0.8);
}
:root[data-theme="light"] .sketch-img {
  filter: brightness(0) opacity(0.6);
}
.group:hover .sketch-img {
  filter: brightness(0) saturate(100%) invert(72%) sepia(40%) saturate(400%)
    hue-rotate(10deg) opacity(1);
}

/* Foto's blijven in kleur; een schaduw zet ze op de achtergrond neer i.p.v.
   ze te laten zweven.

   Donker thema: zwart op #0f0d0d is onzichtbaar, dus daar draagt het merkrood
   (--color-primary, gelijk in beide thema's) de schaduw — een halo die de
   uitsnede volgt plus een rode plas eronder.
   Licht thema: gewone donkere schaduw, die leest op crème wél. */
.photo-img {
  filter: drop-shadow(
      0 0 14px color-mix(in srgb, var(--color-accent) 25%, transparent)
    )
    drop-shadow(
      0 14px 22px color-mix(in srgb, var(--color-accent) 18%, transparent)
    );
}
.group:hover .photo-img {
  filter: drop-shadow(
      0 0 20px color-mix(in srgb, var(--color-accent) 78%, transparent)
    )
    drop-shadow(
      0 16px 26px color-mix(in srgb, var(--color-accent) 52%, transparent)
    );
}
/* Ook op hover ongewijzigd: in het lichte thema beweegt alleen de lichtplek
   en de foto zelf, net als bij de tekeningen ernaast. */
:root[data-theme="light"] .photo-img,
:root[data-theme="light"] .group:hover .photo-img {
  filter: drop-shadow(0 12px 16px rgb(0 0 0 / 0.22));
}

/* Foto mét eigen achtergrond, rond bijgesneden. Een drop-shadow zou hier de
   rechthoek van de foto volgen i.p.v. het product, dus de gloed zit als
   box-shadow om de cirkel. De ring eerst: de donkere leisteen op zo'n foto
   loopt anders naadloos over in de donkere paginakleur. */
.photo-framed {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--color-primary) 60%, transparent),
    0 0 18px color-mix(in srgb, var(--color-primary) 45%, transparent),
    0 14px 22px color-mix(in srgb, var(--color-primary) 30%, transparent);
}
.group:hover .photo-framed {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--color-primary) 90%, transparent),
    0 0 24px color-mix(in srgb, var(--color-primary) 68%, transparent),
    0 16px 26px color-mix(in srgb, var(--color-primary) 45%, transparent);
}
/* Licht thema: dezelfde donkere schaduw als bij de uitsneden, met een
   bronzen ring i.p.v. rood. */
:root[data-theme="light"] .photo-framed,
:root[data-theme="light"] .group:hover .photo-framed {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--color-accent) 45%, transparent),
    0 12px 16px rgb(0 0 0 / 0.22);
}

/* Vierkante tegel met afgeronde hoeken op een egaal vlak: donker thema krijgt
   --color-surface (#1a1414), licht thema wit — beide via dezelfde variabele.
   Geen gloed hier: de tegel zelf is al de achtergrond, een halo eromheen zou
   de rechthoek natrekken. Alleen een zachte diepteschaduw plus een subtiele
   rand, zodat de tegel in het lichte thema niet in de crème wegvalt. */
.photo-tile {
  background: var(--color-surface);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, transparent),
    0 10px 20px rgb(0 0 0 / 0.28);
  transition:
    box-shadow 0.3s ease,
    background 0.3s ease;
}
.group:hover .photo-tile {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 55%, transparent),
    0 14px 26px rgb(0 0 0 / 0.36);
}
:root[data-theme="light"] .photo-tile {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 22%, transparent),
    0 8px 18px rgb(0 0 0 / 0.12);
}
:root[data-theme="light"] .group:hover .photo-tile {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 55%, transparent),
    0 12px 24px rgb(0 0 0 / 0.18);
}

/* Lichtplek achter de foto: vangt de kleurstap op t.o.v. de monochrome
   tekeningen. Donker rood zodat hij samenvalt met de gloed hierboven; licht
   het warme brons, dat op crème rustiger is dan rood. */
.photo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: 92%;
  aspect-ratio: 1;
  border-radius: 10px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-primary) 32%, transparent) 0%,
    color-mix(in srgb, var(--color-primary) 12%, transparent) 45%,
    transparent 70%
  );
  opacity: 0.75;
  transition:
    opacity 0.3s ease,
    scale 0.3s ease;
}
:root[data-theme="light"] .photo-glow {
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent) 24%, transparent) 0%,
    color-mix(in srgb, var(--color-accent) 8%, transparent) 45%,
    transparent 70%
  );
}
.group:hover .photo-glow {
  opacity: 1;
  scale: 1.12;
}
</style>
