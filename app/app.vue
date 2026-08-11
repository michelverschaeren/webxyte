<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Nuxt Projects Starter'
const description = 'A clean Nuxt frontend starter with Tailwind CSS and Nuxt UI, built to launch new websites fast and modernize outdated ones.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const navigation = [
  { label: 'Features', to: '#features' },
  { label: 'Workflow', to: '#workflow' },
  { label: 'Starter', to: '#starter' }
]
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="text-base font-semibold text-highlighted"
        >
          Nuxt Projects
        </NuxtLink>

        <div class="hidden items-center gap-1 md:flex">
          <UButton
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            color="neutral"
            variant="ghost"
            size="sm"
          >
            {{ item.label }}
          </UButton>
        </div>
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          to="#starter"
          trailing-icon="i-lucide-arrow-right"
          size="sm"
        >
          Start from this base
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Clean Nuxt frontend template • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to="https://nuxt.com/docs/getting-started/introduction"
          target="_blank"
          icon="i-lucide-book-open"
          aria-label="Nuxt documentation"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
