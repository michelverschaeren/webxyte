<template>
  <span hidden />
</template>

<script setup lang="ts">
/**
 * Lege standaard. Een site met eigen zoekfunctie levert
 * components/admin/Search.vue (die wint van deze) en zet admin.search op true.
 * Zelfde contract: prop `shortcut`, en `focus()` via defineExpose.
 */
defineProps<{ shortcut?: boolean }>();
defineExpose({ focus: () => {} });
</script>
