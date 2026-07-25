<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForward, timeOutline } from 'ionicons/icons'
import type { Menu } from '@/types/domain'

defineProps<{
  menu: Menu
  mealLabel: string
  mealTime: string
  accent: 'green' | 'amber' | 'blue'
}>()

defineEmits<{
  select: [menuId: string]
}>()
</script>

<template>
  <button
    class="daily-meal-card"
    :class="`daily-meal-card--${accent}`"
    type="button"
    :aria-label="`Buka detail ${menu.name}`"
    @click="$emit('select', menu.id)"
  >
    <div class="daily-meal-card__image-wrap">
      <img
        v-if="menu.imageUrl"
        :src="menu.imageUrl"
        :alt="menu.name"
        class="daily-meal-card__image"
        height="120"
        width="120"
      />
      <div v-else class="daily-meal-card__fallback" aria-hidden="true" />
      <span>{{ mealLabel }}</span>
    </div>

    <div class="daily-meal-card__content">
      <div class="daily-meal-card__time">
        <ion-icon aria-hidden="true" :icon="timeOutline" />
        {{ mealTime }}
      </div>
      <h3>{{ menu.name }}</h3>
      <p>{{ menu.description }}</p>
      <div class="daily-meal-card__nutrition">
        <strong>{{ menu.nutrition.calories }} kkal</strong>
        <span>{{ menu.nutrition.proteinG }} g protein</span>
        <span>{{ menu.preparationMinutes }} menit</span>
      </div>
    </div>

    <span class="daily-meal-card__arrow">
      <ion-icon aria-hidden="true" :icon="chevronForward" />
    </span>
  </button>
</template>

<style scoped>
.daily-meal-card {
  align-items: stretch;
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  color: var(--app-text);
  cursor: pointer;
  display: grid;
  font: inherit;
  grid-template-columns: 104px minmax(0, 1fr) 24px;
  min-height: 124px;
  overflow: hidden;
  padding: 0;
  text-align: left;
  width: 100%;
}

.daily-meal-card:active {
  transform: scale(0.99);
}

.daily-meal-card:focus-visible {
  outline: 3px solid rgba(33, 107, 78, 0.24);
  outline-offset: 2px;
}

.daily-meal-card__image-wrap {
  min-height: 124px;
  overflow: hidden;
  position: relative;
}

.daily-meal-card__image,
.daily-meal-card__fallback {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.daily-meal-card__fallback {
  background: linear-gradient(145deg, #dcebe2, #f4e1c4);
}

.daily-meal-card__image-wrap > span {
  background: rgba(23, 35, 30, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--app-radius-pill);
  bottom: 9px;
  color: #ffffff;
  font-size: 0.56rem;
  font-weight: 850;
  left: 8px;
  padding: 5px 7px;
  position: absolute;
}

.daily-meal-card--amber .daily-meal-card__image-wrap > span {
  background: rgba(132, 79, 8, 0.82);
}

.daily-meal-card--blue .daily-meal-card__image-wrap > span {
  background: rgba(35, 85, 104, 0.82);
}

.daily-meal-card__content {
  min-width: 0;
  padding: var(--app-space-3) var(--app-space-2) var(--app-space-3)
    var(--app-space-3);
}

.daily-meal-card__time {
  align-items: center;
  color: var(--ion-color-primary);
  display: flex;
  font-size: 0.58rem;
  font-weight: 800;
  gap: 4px;
}

.daily-meal-card__time ion-icon {
  font-size: 0.75rem;
}

h3 {
  color: var(--app-text);
  font-size: 0.85rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 5px 0 4px;
}

p {
  color: var(--app-text-muted);
  display: -webkit-box;
  font-size: 0.58rem;
  -webkit-line-clamp: 1;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.daily-meal-card__nutrition {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.55rem;
  gap: 5px;
  margin-top: 8px;
}

.daily-meal-card__nutrition strong {
  color: var(--ion-color-primary);
  font-size: 0.62rem;
}

.daily-meal-card__nutrition span {
  border-left: 1px solid var(--app-border);
  padding-left: 5px;
}

.daily-meal-card__arrow {
  align-items: center;
  color: var(--ion-color-primary);
  display: flex;
  justify-content: center;
}

.daily-meal-card__arrow ion-icon {
  font-size: 1rem;
}
</style>
