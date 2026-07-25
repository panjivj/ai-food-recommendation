<script setup lang="ts">
import { IonHeader, IonTitle, IonToolbar } from '@ionic/vue'

withDefaults(
  defineProps<{
    title: string
    translucent?: boolean
  }>(),
  {
    translucent: true,
  },
)
</script>

<template>
  <ion-header :translucent="translucent" class="app-header">
    <ion-toolbar>
      <ion-title>{{ title }}</ion-title>
      <slot name="end" />
    </ion-toolbar>
  </ion-header>
</template>

<style scoped>
.app-header {
  box-shadow: none;
}

ion-toolbar {
  --min-height: 64px;
  --padding-start: var(--app-space-1);
  --padding-end: var(--app-space-2);
}
</style>
