<script setup lang="ts">
import { IonIcon } from '@ionic/vue'

defineProps<{
  title: string
  description: string
  icon: string
  tone?: 'green' | 'amber'
}>()
</script>

<template>
  <article class="foundation-card app-card" :class="`foundation-card--${tone ?? 'green'}`">
    <span class="foundation-card__icon">
      <ion-icon aria-hidden="true" :icon="icon" />
    </span>
    <div>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
  </article>
</template>

<style scoped>
.foundation-card {
  align-items: center;
  display: flex;
  gap: var(--app-space-4);
  padding: var(--app-space-4);
}

.foundation-card__icon {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-md);
  color: var(--ion-color-primary);
  display: inline-flex;
  flex: 0 0 48px;
  height: 48px;
  justify-content: center;
}

.foundation-card--amber .foundation-card__icon {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

ion-icon {
  font-size: 1.4rem;
}

h2 {
  color: var(--app-text);
  font-size: 0.9375rem;
  font-weight: 800;
  line-height: 1.3;
  margin: 0;
}

p {
  color: var(--app-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: var(--app-space-1) 0 0;
}
</style>
