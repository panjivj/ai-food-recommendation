<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { constructOutline } from 'ionicons/icons'

defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <section class="screen-placeholder app-card">
    <span class="screen-placeholder__icon">
      <ion-icon aria-hidden="true" :icon="constructOutline" />
    </span>
    <p class="app-eyebrow">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p class="screen-placeholder__description">{{ description }}</p>
  </section>
</template>

<style scoped>
.screen-placeholder {
  margin-top: var(--app-space-6);
  padding: var(--app-space-8) var(--app-space-6);
  text-align: center;
}

.screen-placeholder__icon {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 50%;
  color: var(--ion-color-primary);
  display: inline-flex;
  height: 64px;
  justify-content: center;
  margin-bottom: var(--app-space-5);
  width: 64px;
}

ion-icon {
  font-size: 1.75rem;
}

h1 {
  color: var(--app-text);
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.screen-placeholder__description {
  color: var(--app-text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: var(--app-space-3) auto 0;
  max-width: 280px;
}
</style>
