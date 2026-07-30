<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  repeatOutline,
  restaurantOutline,
  sparklesOutline,
  timeOutline,
} from 'ionicons/icons'
import type { DailyRecommendationItem } from '@/types/domain'

defineProps<{
  accent: 'green' | 'amber' | 'blue' | 'rose'
  item: DailyRecommendationItem
  mealLabel: string
  mealTime: string
}>()

defineEmits<{
  replace: []
  select: [menuId: string]
}>()
</script>

<template>
  <article
    class="daily-meal-card"
    :class="`daily-meal-card--${accent}`"
  >
    <button
      class="daily-meal-card__select"
      type="button"
      :aria-label="`Buka detail ${item.menu.name}`"
      @click="$emit('select', item.menu.id)"
    >
      <div class="daily-meal-card__visual">
        <ion-icon aria-hidden="true" :icon="restaurantOutline" />
        <span>{{ mealLabel }}</span>
      </div>

      <div class="daily-meal-card__content">
        <div class="daily-meal-card__topline">
          <span>
            <ion-icon aria-hidden="true" :icon="timeOutline" />
            {{ mealTime }}
          </span>
          <strong>
            Target {{ item.targetCalories.toLocaleString('id-ID') }} kkal
          </strong>
        </div>

        <h3>{{ item.menu.name }}</h3>
        <p>{{ item.menu.description }}</p>

        <div class="daily-meal-card__nutrition">
          <strong>
            {{ item.menu.nutrition.energyKcal.toLocaleString('id-ID') }} kkal
          </strong>
          <span v-if="item.menu.nutrition.proteinG !== null">
            {{ item.menu.nutrition.proteinG.toLocaleString('id-ID') }} g protein
          </span>
          <span>{{ item.menu.servingDescription }}</span>
        </div>

        <div v-if="item.reasons[0]" class="daily-meal-card__reason">
          <ion-icon aria-hidden="true" :icon="sparklesOutline" />
          <span>{{ item.reasons[0].message }}</span>
          <strong>Skor {{ Math.round(item.score.total) }}</strong>
        </div>
      </div>
    </button>

    <button
      class="daily-meal-card__replace"
      type="button"
      :aria-label="`Cari pengganti ${item.menu.name}`"
      @click="$emit('replace')"
    >
      <ion-icon aria-hidden="true" :icon="repeatOutline" />
      Ganti
    </button>
  </article>
</template>

<style scoped>
.daily-meal-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  color: var(--app-text);
  min-height: 148px;
  overflow: hidden;
  position: relative;
}

.daily-meal-card__select {
  align-items: stretch;
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--app-text);
  cursor: pointer;
  display: grid;
  font: inherit;
  grid-template-columns: 94px minmax(0, 1fr);
  min-height: 148px;
  padding: 0;
  text-align: left;
  width: 100%;
}

.daily-meal-card__select:active {
  transform: scale(0.99);
}

.daily-meal-card__select:focus-visible,
.daily-meal-card__replace:focus-visible {
  outline: 3px solid rgba(33, 107, 78, 0.24);
  outline-offset: 2px;
}

.daily-meal-card__visual {
  align-items: center;
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.72), transparent 24%),
    linear-gradient(145deg, #dcebe2, #f2ead8);
  display: flex;
  justify-content: center;
  min-height: 148px;
  position: relative;
}

.daily-meal-card__visual > ion-icon {
  color: rgba(33, 107, 78, 0.55);
  font-size: 2.15rem;
}

.daily-meal-card__visual > span {
  background: rgba(23, 72, 52, 0.88);
  border-radius: var(--app-radius-pill);
  bottom: 10px;
  color: #ffffff;
  font-size: 0.55rem;
  font-weight: 850;
  left: 8px;
  padding: 5px 7px;
  position: absolute;
}

.daily-meal-card--amber .daily-meal-card__visual {
  background: linear-gradient(145deg, #f5e7cc, #f7f1e5);
}

.daily-meal-card--amber .daily-meal-card__visual > span {
  background: rgba(132, 79, 8, 0.86);
}

.daily-meal-card--blue .daily-meal-card__visual {
  background: linear-gradient(145deg, #dcecf0, #edf3f4);
}

.daily-meal-card--blue .daily-meal-card__visual > span {
  background: rgba(35, 85, 104, 0.86);
}

.daily-meal-card--rose .daily-meal-card__visual {
  background: linear-gradient(145deg, #f1dfdc, #f6eee7);
}

.daily-meal-card--rose .daily-meal-card__visual > span {
  background: rgba(133, 65, 70, 0.86);
}

.daily-meal-card__content {
  min-width: 0;
  padding: var(--app-space-3) var(--app-space-3) 42px;
}

.daily-meal-card__topline {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
  justify-content: space-between;
}

.daily-meal-card__topline > span {
  align-items: center;
  color: var(--ion-color-primary);
  display: flex;
  font-size: 0.56rem;
  font-weight: 800;
  gap: 4px;
}

.daily-meal-card__topline > strong {
  color: var(--app-text-muted);
  font-size: 0.54rem;
  font-weight: 750;
}

.daily-meal-card__topline ion-icon {
  font-size: 0.72rem;
}

h3 {
  color: var(--app-text);
  font-size: 0.86rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 6px 0 4px;
}

p {
  color: var(--app-text-muted);
  display: -webkit-box;
  font-size: 0.57rem;
  -webkit-line-clamp: 2;
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
  font-size: 0.53rem;
  gap: 5px;
  margin-top: 8px;
}

.daily-meal-card__nutrition strong {
  color: var(--ion-color-primary);
  font-size: 0.61rem;
}

.daily-meal-card__nutrition span {
  border-left: 1px solid var(--app-border);
  padding-left: 5px;
}

.daily-meal-card__reason {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 8px;
  color: var(--ion-color-primary);
  display: grid;
  font-size: 0.51rem;
  gap: 4px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  margin-top: 8px;
  padding: 5px 6px;
}

.daily-meal-card__reason span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daily-meal-card__reason strong {
  font-size: 0.5rem;
  white-space: nowrap;
}

.daily-meal-card__replace {
  align-items: center;
  appearance: none;
  background: var(--app-primary-soft);
  border: 1px solid rgba(33, 107, 78, 0.16);
  border-radius: var(--app-radius-pill);
  bottom: 10px;
  color: var(--ion-color-primary);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.55rem;
  font-weight: 850;
  gap: 4px;
  min-height: 26px;
  padding: 0 9px;
  position: absolute;
  right: 10px;
}

.daily-meal-card__replace ion-icon {
  font-size: 0.72rem;
}

@media (max-width: 360px) {
  .daily-meal-card__select {
    grid-template-columns: 80px minmax(0, 1fr);
  }
}
</style>
