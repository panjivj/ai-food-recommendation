<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { flame, nutritionOutline, waterOutline } from 'ionicons/icons'

defineProps<{
  plannedCalories: number
  calorieTarget: number
  protein: number
  carbohydrate: number
  fat: number
}>()
</script>

<template>
  <section class="calorie-card" aria-labelledby="calorie-title">
    <div class="calorie-card__topline">
      <div>
        <span class="calorie-card__eyebrow">Rencana makan hari ini</span>
        <h2 id="calorie-title">Ringkasan kalori</h2>
      </div>
      <span class="calorie-card__badge">
        <ion-icon aria-hidden="true" :icon="flame" />
        Seimbang
      </span>
    </div>

    <div class="calorie-card__body">
      <div
        class="calorie-progress"
        :style="{ '--progress': `${Math.round((plannedCalories / calorieTarget) * 100) * 3.6}deg` }"
        role="img"
        :aria-label="`${plannedCalories} dari ${calorieTarget} kilokalori`"
      >
        <div class="calorie-progress__inner">
          <strong>{{ plannedCalories.toLocaleString('id-ID') }}</strong>
          <span>dari {{ calorieTarget.toLocaleString('id-ID') }} kkal</span>
        </div>
      </div>

      <div class="calorie-card__copy">
        <strong>{{ Math.round((plannedCalories / calorieTarget) * 100) }}%</strong>
        <span>target harian telah tersusun dalam rekomendasi menu.</span>
      </div>
    </div>

    <div class="macro-grid" aria-label="Ringkasan makronutrisi">
      <div class="macro-item">
        <span class="macro-item__icon macro-item__icon--protein">
          <ion-icon aria-hidden="true" :icon="nutritionOutline" />
        </span>
        <span>
          <strong>{{ protein }} g</strong>
          Protein
        </span>
      </div>

      <div class="macro-item">
        <span class="macro-item__icon macro-item__icon--carb">C</span>
        <span>
          <strong>{{ carbohydrate }} g</strong>
          Karbo
        </span>
      </div>

      <div class="macro-item">
        <span class="macro-item__icon macro-item__icon--fat">
          <ion-icon aria-hidden="true" :icon="waterOutline" />
        </span>
        <span>
          <strong>{{ fat }} g</strong>
          Lemak
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.calorie-card {
  background:
    radial-gradient(circle at 96% 4%, rgba(240, 168, 75, 0.27), transparent 32%),
    linear-gradient(145deg, #216b4e 0%, #18583f 100%);
  border-radius: var(--app-radius-lg);
  box-shadow: 0 16px 32px rgba(33, 107, 78, 0.2);
  color: #ffffff;
  overflow: hidden;
  padding: var(--app-space-5);
}

.calorie-card__topline {
  align-items: flex-start;
  display: flex;
  gap: var(--app-space-3);
  justify-content: space-between;
}

.calorie-card__eyebrow {
  color: rgba(255, 255, 255, 0.7);
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}

h2 {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.calorie-card__badge {
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--app-radius-pill);
  display: flex;
  font-size: 0.68rem;
  font-weight: 800;
  gap: 5px;
  padding: 7px 9px;
}

.calorie-card__badge ion-icon {
  color: #ffc876;
  font-size: 0.85rem;
}

.calorie-card__body {
  align-items: center;
  display: flex;
  gap: var(--app-space-4);
  padding: var(--app-space-5) 0;
}

.calorie-progress {
  align-items: center;
  background: conic-gradient(#f4b860 var(--progress), rgba(255, 255, 255, 0.15) 0);
  border-radius: 50%;
  display: flex;
  flex: 0 0 104px;
  height: 104px;
  justify-content: center;
  position: relative;
}

.calorie-progress::after {
  background: #1d6247;
  border-radius: 50%;
  content: "";
  inset: 8px;
  position: absolute;
}

.calorie-progress__inner {
  position: relative;
  text-align: center;
  z-index: 1;
}

.calorie-progress__inner strong {
  display: block;
  font-size: 1.5rem;
  letter-spacing: -0.05em;
  line-height: 1;
}

.calorie-progress__inner span {
  color: rgba(255, 255, 255, 0.68);
  display: block;
  font-size: 0.58rem;
  margin-top: 5px;
}

.calorie-card__copy {
  display: grid;
  gap: var(--app-space-1);
}

.calorie-card__copy strong {
  font-size: 1.6rem;
  letter-spacing: -0.04em;
  line-height: 1;
}

.calorie-card__copy span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  line-height: 1.45;
}

.macro-grid {
  border-top: 1px solid rgba(255, 255, 255, 0.13);
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(3, 1fr);
  padding-top: var(--app-space-4);
}

.macro-item {
  align-items: center;
  display: flex;
  gap: 7px;
  min-width: 0;
}

.macro-item__icon {
  align-items: center;
  background: rgba(255, 255, 255, 0.13);
  border-radius: 9px;
  color: #d9f6e8;
  display: inline-flex;
  flex: 0 0 30px;
  font-size: 0.72rem;
  font-weight: 900;
  height: 30px;
  justify-content: center;
}

.macro-item__icon--carb {
  color: #ffe0ae;
}

.macro-item__icon--fat {
  color: #cde9ff;
}

.macro-item > span:last-child {
  color: rgba(255, 255, 255, 0.62);
  display: grid;
  font-size: 0.58rem;
  line-height: 1.25;
}

.macro-item strong {
  color: #ffffff;
  font-size: 0.72rem;
}
</style>
