<script setup lang="ts">
const platformFeatures = [
  {
    icon: 'i-lucide-layout-template',
    title: 'Reusable website base',
    description: 'Start each project from a clean Nuxt structure with opinionated defaults, polished layout primitives, and room to plug in your own brand system.'
  },
  {
    icon: 'i-lucide-palette',
    title: 'Tailwind CSS + Nuxt UI',
    description: 'Ship responsive pages quickly with Tailwind utilities and accessible Nuxt UI components that already support dark mode and consistent spacing.'
  },
  {
    icon: 'i-lucide-scan-text',
    title: 'Ready for website refresh work',
    description: 'Reuse this starter when rebuilding outdated websites from imported copy, context, and images gathered from an existing online presence.'
  },
  {
    icon: 'i-lucide-rocket',
    title: 'Fast to present',
    description: 'Move from idea to polished preview quickly so you can show prospects a modern redesign and make the value of a new website obvious.'
  },
  {
    icon: 'i-lucide-monitor-smartphone',
    title: 'Responsive foundation',
    description: 'Build pages that feel at home on mobile, tablet, and desktop without reworking every section from scratch for each new project.'
  },
  {
    icon: 'i-lucide-search-check',
    title: 'SEO-friendly basics',
    description: 'Start with metadata, semantic sections, and a lightweight structure that is ready to expand into production-grade marketing websites.'
  }
]

// Every image below follows the rules in CLAUDE.md ("Image rules"). The source
// files are 1200x900 WebP, so `width`/`height` are the real source dimensions
// and the largest srcset candidate (2xl: 33vw of 1536 = 507, x2 = 1014) stays
// under 1200 -- no upscaled, oversized variants.
const workflow = [
  {
    step: '01',
    title: 'Collect what already exists',
    description: 'Bring in text, context, and imagery from an old website so you can focus on repositioning the brand instead of recreating raw material.',
    image: '/images/collect-material.webp'
  },
  {
    step: '02',
    title: 'Rebuild with a modern front-end',
    description: 'Compose a cleaner information hierarchy, stronger visual sections, and better calls to action using the shared Nuxt + UI foundation.',
    image: '/images/rebuild-frontend.webp'
  },
  {
    step: '03',
    title: 'Present a convincing redesign',
    description: 'Use the finished preview as a concrete sales asset to show website owners what their next online presence could look like.',
    image: '/images/present-redesign.webp'
  }
]

const starterChecklist = [
  'Nuxt 4 app structure with TypeScript enabled',
  'Nuxt UI components and Tailwind CSS 4 configured',
  'Responsive hero, feature, workflow, and CTA sections',
  'Starter copy focused on rebuilding outdated websites',
  'Simple navigation, SEO metadata, and dark mode support'
]
</script>

<template>
  <div>
    <UPageHero
      title="Clean Nuxt frontend, ready for new websites"
      description="Use this as the base template for new website builds and fast redesigns of outdated sites. Tailwind CSS, Nuxt UI, and a clean structure are already in place so you can move straight into content, branding, and conversion-focused design."
      :links="[{ label: 'Explore the starter', to: '#starter', trailingIcon: 'i-lucide-arrow-right', size: 'xl' }, { label: 'Nuxt UI docs', to: 'https://ui.nuxt.com', target: '_blank', icon: 'i-lucide-book-open', size: 'xl', color: 'neutral', variant: 'subtle' }]"
    >
      <template #headline>
        <UBadge
          variant="subtle"
          size="lg"
        >
          Base template for fast website delivery
        </UBadge>
      </template>

      <!--
        LCP image: no `loading="lazy"`, and both a high-priority preload link
        and fetchpriority so the browser starts it before hydration.
        Source is 2048x1152, so at lg+ (1024 CSS px) the 2x candidate lands
        exactly on the source width instead of upscaling past it.
      -->
      <NuxtImg
        src="/images/hero-workspace.webp"
        alt="Abstract composition representing a rebuilt website layout"
        format="webp"
        :width="2048"
        :height="1152"
        sizes="xs:100vw sm:100vw md:100vw lg:1024px xl:1024px 2xl:1024px"
        :preload="{ fetchPriority: 'high' }"
        fetchpriority="high"
        decoding="async"
        class="w-full rounded-2xl shadow-lg ring ring-default"
      />
    </UPageHero>

    <UPageSection
      id="features"
      title="A practical starting point for agency-style website work"
      description="Keep the stack consistent, reduce setup time, and spend more energy on strategy and design instead of rebuilding fundamentals for every project."
      :features="platformFeatures"
    />

    <UPageSection
      id="workflow"
      title="Built for modernizing old websites"
      description="This template supports the workflow of collecting material from an outdated site and turning it into a better online experience you can confidently show to the owner."
    >
      <div class="grid gap-6 lg:grid-cols-3">
        <div
          v-for="item in workflow"
          :key="item.step"
          class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <!--
            Below the fold: lazy. Every breakpoint is written out -- stopping at
            `md:33vw` would cap the srcset at a 768px-screen candidate and look
            soft on a 1536px screen.
          -->
          <NuxtImg
            :src="item.image"
            :alt="`Illustration for step ${item.step}: ${item.title}`"
            format="webp"
            :width="1200"
            :height="900"
            sizes="xs:100vw sm:50vw md:33vw lg:33vw xl:33vw 2xl:33vw"
            loading="lazy"
            decoding="async"
            class="aspect-4/3 w-full object-cover"
          />

          <div class="p-6">
            <p class="text-sm font-semibold text-primary">
              Step {{ item.step }}
            </p>
            <h3 class="mt-3 text-lg font-semibold text-highlighted">
              {{ item.title }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-toned">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>
    </UPageSection>

    <UPageSection
      id="starter"
      title="What is already included"
      description="A small but useful base you can clone and adapt for service sites, brochure sites, landing pages, or proof-of-concept redesigns."
    >
      <div class="rounded-3xl border border-primary/20 bg-primary/5 p-8">
        <div class="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Starter checklist
            </p>
            <h3 class="mt-3 text-2xl font-semibold text-highlighted">
              Ready to brand, extend, and turn into your next client proposal
            </h3>
            <p class="mt-4 max-w-2xl text-sm leading-6 text-toned">
              Swap in real brand colors, structure the imported content, and expand the section library as needed. The foundation is intentionally clean so it can support many different kinds of websites.
            </p>
          </div>

          <ul class="space-y-3">
            <li
              v-for="item in starterChecklist"
              :key="item"
              class="flex items-start gap-3 rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-toned dark:bg-gray-950/60"
            >
              <UIcon
                name="i-lucide-check"
                class="mt-0.5 shrink-0 text-primary"
              />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </UPageSection>

    <UPageSection>
      <UPageCTA
        title="Start from this template and ship the next website faster"
        description="Use the current structure as your baseline, replace the placeholder messaging with real client content, and keep iterating toward a polished redesign."
        variant="subtle"
        :links="[{ label: 'Go to Nuxt docs', to: 'https://nuxt.com/docs/getting-started/introduction', target: '_blank', trailingIcon: 'i-lucide-arrow-right', color: 'neutral' }]"
      />
    </UPageSection>
  </div>
</template>
