<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForward, timeOutline } from 'ionicons/icons'
import type { Menu } from '@/types/domain'

defineProps<{
  menu: Menu
  mealLabel: string
  mealTime: string
}>()

defineEmits<{
  select: [menuId: string]
}>()
</script>

<template>
  <button
    class="meal-card"
    type="button"
    :aria-label="`Buka detail ${menu.name}`"
    @click="$emit('select', menu.id)"
  >
    <div class="meal-card__image-wrap">
      <img
        class="meal-card__image"
        :src="menu.imageUrl"
        :alt="menu.name"
        height="180"
        width="240"
      />
      <span class="meal-card__label">{{ mealLabel }}</span>
    </div>

    <div class="meal-card__body">
      <div class="meal-card__top">
        <span>{{ mealTime }}</span>
        <ion-icon aria-hidden="true" :icon="chevronForward" />
      </div>
      <h3>{{ menu.name }}</h3>
      <div class="meal-card__meta">
        <strong>{{ menu.nutrition.calories }} kkal</strong>
        <span aria-hidden="true">•</span>
        <span>
          <ion-icon aria-hidden="true" :icon="timeOutline" />
          {{ menu.preparationMinutes }} menit
        </span>
      </div>
    </div>
  </button>
</template>

<style scoped>
.meal-card {
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  color: var(--app-text);
  cursor: pointer;
  flex: 0 0 238px;
  font: inherit;
  overflow: hidden;
  padding: 0;
  text-align: left;
}

.meal-card:focus-visible {
  outline: 3px solid rgba(33, 107, 78, 0.25);
  outline-offset: 2px;
}

.meal-card:active {
  transform: scale(0.985);
}

.meal-card__image-wrap {
  height: 142px;
  overflow: hidden;
  position: relative;
}

.meal-card__image {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.meal-card__label {
  background: rgba(23, 35, 30, 0.74);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--app-radius-pill);
  bottom: var(--app-space-3);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  left: var(--app-space-3);
  padding: 6px 9px;
  position: absolute;
}

.meal-card__body {
  padding: var(--app-space-4);
}

.meal-card__top {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.68rem;
  font-weight: 700;
  justify-content: space-between;
}

.meal-card__top ion-icon {
  color: var(--ion-color-primary);
  font-size: 1rem;
}

h3 {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 6px 0 var(--app-space-2);
  min-height: 40px;
}

.meal-card__meta {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.7rem;
  gap: 6px;
}

.meal-card__meta strong {
  color: var(--ion-color-primary);
}

.meal-card__meta span:last-child {
  align-items: center;
  display: flex;
  gap: 3px;
}
</style>
