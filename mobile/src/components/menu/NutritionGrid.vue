<script setup lang="ts">
import type { Nutrition } from '@/types/domain'

defineProps<{
  nutrition: Nutrition
}>()
</script>

<template>
  <section class="nutrition-section" aria-labelledby="nutrition-title">
    <div class="section-heading">
      <div>
        <p>Informasi gizi</p>
        <h2 id="nutrition-title">Nutrisi per porsi</h2>
      </div>
      <span>Estimasi</span>
    </div>

    <div class="nutrition-grid">
      <article class="nutrition-item nutrition-item--calories">
        <span>Kalori</span>
        <strong>{{ nutrition.calories }}</strong>
        <small>kkal</small>
      </article>
      <article class="nutrition-item">
        <span>Protein</span>
        <strong>{{ nutrition.proteinG }}</strong>
        <small>gram</small>
      </article>
      <article class="nutrition-item">
        <span>Karbo</span>
        <strong>{{ nutrition.carbohydrateG }}</strong>
        <small>gram</small>
      </article>
      <article class="nutrition-item">
        <span>Lemak</span>
        <strong>{{ nutrition.fatG }}</strong>
        <small>gram</small>
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
  font-size: 0.65rem;
  font-weight: 750;
  padding: 6px 9px;
}

.nutrition-grid {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(4, 1fr);
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

.nutrition-item--calories {
  background: var(--app-primary-soft);
  border-color: #c8e4d5;
}

.nutrition-item span {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  font-weight: 700;
}

.nutrition-item strong {
  color: var(--app-text);
  font-size: 1.2rem;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 7px 0 4px;
}

.nutrition-item--calories strong {
  color: var(--ion-color-primary);
}

.nutrition-item small {
  color: var(--app-text-muted);
  font-size: 0.55rem;
}
</style>
