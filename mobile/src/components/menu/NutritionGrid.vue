<script setup lang="ts">
import { computed } from 'vue'
import type { MenuNutritionDetail } from '@/types/domain'

const props = defineProps<{
  nutrition: MenuNutritionDetail
}>()

interface NutritionDisplayItem {
  key: keyof MenuNutritionDetail
  label: string
  unit: string
}

const primaryItems: NutritionDisplayItem[] = [
  { key: 'energyKcal', label: 'Energy', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbohydrateG', label: 'Carbohydrate', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
  { key: 'fiberG', label: 'Fiber', unit: 'g' },
  { key: 'waterG', label: 'Water', unit: 'g' },
]

const detailItems: NutritionDisplayItem[] = [
  { key: 'ashG', label: 'Ash', unit: 'g' },
  { key: 'calciumMg', label: 'Calcium', unit: 'mg' },
  { key: 'phosphorusMg', label: 'Phosphorus', unit: 'mg' },
  { key: 'ironMg', label: 'Iron', unit: 'mg' },
  { key: 'sodiumMg', label: 'Sodium', unit: 'mg' },
  { key: 'potassiumMg', label: 'Potassium', unit: 'mg' },
  { key: 'copperMg', label: 'Copper', unit: 'mg' },
  { key: 'zincMg', label: 'Zinc', unit: 'mg' },
  { key: 'retinolMcg', label: 'Retinol', unit: 'mcg' },
  { key: 'betaCaroteneMcg', label: 'Beta-carotene', unit: 'mcg' },
  { key: 'totalCaroteneMcg', label: 'Total carotene', unit: 'mcg' },
  { key: 'thiaminMg', label: 'Vitamin B1 (Thiamine)', unit: 'mg' },
  { key: 'riboflavinMg', label: 'Vitamin B2 (Riboflavin)', unit: 'mg' },
  { key: 'niacinMg', label: 'Vitamin B3 (Niacin)', unit: 'mg' },
  { key: 'vitaminCMg', label: 'Vitamin C', unit: 'mg' },
]

const formattedPrimaryItems = computed(() =>
  primaryItems.map((item) => ({
    ...item,
    value: formatValue(props.nutrition[item.key]),
  })),
)

const formattedDetailItems = computed(() =>
  detailItems.map((item) => ({
    ...item,
    value: formatValue(props.nutrition[item.key]),
  })),
)

function formatValue(value: number | null): string {
  return value === null
    ? '—'
    : value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}
</script>

<template>
  <section class="nutrition-section" aria-labelledby="nutrition-title">
    <div class="section-heading">
      <div>
        <p>Nutrition information</p>
        <h2 id="nutrition-title">Nutrition per serving</h2>
      </div>
      <span>Curated data</span>
    </div>

    <div class="nutrition-grid nutrition-grid--primary">
      <article
        v-for="item in formattedPrimaryItems"
        :key="item.key"
        class="nutrition-item"
        :class="{ 'nutrition-item--energy': item.key === 'energyKcal' }"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.value === '—' ? 'unavailable' : item.unit }}</small>
      </article>
    </div>

    <h3>Minerals &amp; vitamins</h3>
    <div class="nutrition-grid nutrition-grid--detail">
      <article
        v-for="item in formattedDetailItems"
        :key="item.key"
        class="nutrition-detail"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }} <small v-if="item.value !== '—'">{{ item.unit }}</small></strong>
      </article>
    </div>
  </section>
</template>

<style scoped>
.section-heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--app-space-4);
}

.section-heading p {
  color: var(--ion-color-primary);
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  text-transform: uppercase;
}

.section-heading h2 {
  color: var(--app-text);
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  margin: 0;
}

.section-heading > span {
  background: var(--app-surface-soft);
  border-radius: var(--app-radius-pill);
  color: var(--app-text-muted);
  font-size: 0.62rem;
  font-weight: 750;
  padding: 6px 9px;
}

.nutrition-grid {
  display: grid;
  gap: var(--app-space-2);
}

.nutrition-grid--primary {
  grid-template-columns: repeat(3, 1fr);
}

.nutrition-item {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  min-width: 0;
  padding: var(--app-space-3) 8px;
  text-align: center;
}

.nutrition-item--energy {
  background: var(--app-primary-soft);
  border-color: #c8e4d5;
}

.nutrition-item > span {
  color: var(--app-text-muted);
  font-size: 0.56rem;
  font-weight: 700;
}

.nutrition-item strong {
  color: var(--app-text);
  font-size: 1.12rem;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 7px 0 4px;
}

.nutrition-item--energy strong {
  color: var(--ion-color-primary);
}

.nutrition-item > small {
  color: var(--app-text-muted);
  font-size: 0.52rem;
}

h3 {
  color: var(--app-text);
  font-size: 0.75rem;
  font-weight: 800;
  margin: var(--app-space-5) 0 var(--app-space-3);
}

.nutrition-grid--detail {
  grid-template-columns: repeat(2, 1fr);
}

.nutrition-detail {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 10px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
  padding: 9px 10px;
}

.nutrition-detail > span {
  color: var(--app-text-muted);
  font-size: 0.56rem;
}

.nutrition-detail strong {
  color: var(--app-text);
  font-size: 0.62rem;
  white-space: nowrap;
}

.nutrition-detail small {
  color: var(--app-text-muted);
  font-size: 0.5rem;
  font-weight: 650;
}

@media (max-width: 360px) {
  .nutrition-grid--primary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
