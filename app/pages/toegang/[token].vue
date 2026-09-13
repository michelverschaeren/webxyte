<template>
  <div />
</template>

<script setup lang="ts">
// Eenmalige toegangslink voor één klant: bevat het token de juiste waarde
// (NUXT_PUBLIC_CUSTOMER_ACCESS_TOKEN), dan omzeilt dit de site-lock net als
// het wachtwoord zou doen, en land de bezoeker meteen op de productencatalogus.
definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig();
const { unlock } = useSiteLock();

const expected = config.public.customerAccessToken;
const token = route.params.token as string;

if (expected && token === expected) {
  unlock();
  await navigateTo("/producten", { replace: true });
} else {
  await navigateTo("/", { replace: true });
}
</script>
