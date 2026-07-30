<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  onIonViewWillEnter,
} from '@ionic/vue'
import {
  arrowBack,
  calendarNumberOutline,
  checkmarkCircle,
  flameOutline,
  refreshOutline,
  restaurantOutline,
  warningOutline,
} from 'ionicons/icons'
import {
  localDateKey,
  useRecommendationStore,
} from '@/stores/recommendation'
import type {
  DailyRecommendationResult,
  RecommendationMealType,
} from '@/types/domain'

const route = useRoute()
const router = useRouter()
const recommendationStore = useRecommendationStore()
const startDate = ref(localDateKey())

const mealLabels: Record<RecommendationMealType, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan siang',
  dinner: 'Makan malam',
  snack: 'Camilan',
}

const plan = computed(() => recommendationStore.weeklyPlan)

const isDateKey = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

const formatDate = (
  value: string,
  options: Intl.DateTimeFormatOptions,
) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', options).format(
    new Date(year, month - 1, day),
  )
}

const dateRange = computed(() => {
  if (!plan.value) return ''

  const start = formatDate(plan.value.startDate, {
    day: 'numeric',
    month: 'short',
  })
  const end = formatDate(plan.value.endDate, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${start} – ${end}`
})

const loadPlan = async () => {
  await recommendationStore.fetchWeekly(startDate.value)
}

const chooseStartDate = async () => {
  await router.replace({
    name: 'weekly-recommendations',
    query: { start: startDate.value },
  })
  await loadPlan()
}

const openDay = async (day: DailyRecommendationResult) => {
  recommendationStore.recommendation = day
  await router.push({
    name: 'recommendations',
    query: { date: day.date },
  })
}

onIonViewWillEnter(() => {
  startDate.value = isDateKey(route.query.start)
    ? route.query.start
    : localDateKey()
  void loadPlan()
})
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="weekly-page">
        <header class="weekly-header">
          <button
            type="button"
            aria-label="Kembali ke rekomendasi harian"
            @click="router.push({ name: 'recommendations' })"
          >
            <ion-icon aria-hidden="true" :icon="arrowBack" />
          </button>
          <div>
            <p>Rencana makan otomatis</p>
            <h1>Menu 7 hari</h1>
          </div>
        </header>

        <section class="week-picker">
          <div>
            <ion-icon aria-hidden="true" :icon="calendarNumberOutline" />
            <span>
              <small>Tanggal mulai</small>
              <strong>Pilih periode tujuh hari</strong>
            </span>
          </div>
          <input
            v-model="startDate"
            type="date"
            aria-label="Tanggal mulai rencana tujuh hari"
            @change="chooseStartDate"
          />
        </section>

        <section
          v-if="recommendationStore.weeklyLoading"
          class="weekly-state"
          aria-live="polite"
        >
          <ion-spinner name="crescent" />
          <h2>Menyiapkan 28 pilihan menu</h2>
          <p>
            Sistem menyusun tujuh hari tanpa mengulang menu serta tetap
            menerapkan profil dan target kalorimu.
          </p>
        </section>

        <section
          v-else-if="recommendationStore.weeklyErrorMessage"
          class="weekly-state weekly-state--error"
          aria-live="polite"
        >
          <ion-icon aria-hidden="true" :icon="warningOutline" />
          <h2>Rencana belum dapat disiapkan</h2>
          <p>{{ recommendationStore.weeklyErrorMessage }}</p>
          <button type="button" @click="loadPlan">
            <ion-icon aria-hidden="true" :icon="refreshOutline" />
            Coba lagi
          </button>
        </section>

        <template v-else-if="plan">
          <section class="weekly-summary">
            <div class="weekly-summary__heading">
              <span>
                <ion-icon aria-hidden="true" :icon="checkmarkCircle" />
              </span>
              <div>
                <p>{{ dateRange }}</p>
                <h2>Rencana mingguan siap</h2>
              </div>
            </div>
            <div class="weekly-summary__metrics">
              <div>
                <strong>{{ plan.days.length }}</strong>
                <small>hari</small>
              </div>
              <div>
                <strong>{{ plan.totalMenus }}</strong>
                <small>jadwal makan</small>
              </div>
              <div>
                <strong>{{ plan.uniqueMenuCount }}</strong>
                <small>menu unik</small>
              </div>
            </div>
            <p>
              {{
                plan.isFullyUnique
                  ? 'Tidak ada menu yang berulang dalam periode ini.'
                  : plan.warnings[0]
              }}
            </p>
          </section>

          <section class="weekly-list" aria-labelledby="weekly-list-title">
            <div class="section-heading">
              <div>
                <p>Ringkasan jadwal</p>
                <h2 id="weekly-list-title">Tujuh hari ke depan</h2>
              </div>
              <span>Tekan hari untuk melihat detail</span>
            </div>

            <article
              v-for="(day, index) in plan.days"
              :key="day.date"
              class="day-card"
            >
              <header>
                <span>{{ index === 0 ? 'Hari pertama' : `Hari ${index + 1}` }}</span>
                <div>
                  <h3>
                    {{
                      formatDate(day.date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    }}
                  </h3>
                  <p>
                    <ion-icon aria-hidden="true" :icon="flameOutline" />
                    {{ day.totalRecommendedCalories.toLocaleString('id-ID') }}
                    / {{ day.dailyTargetCalories.toLocaleString('id-ID') }}
                    kkal
                  </p>
                </div>
              </header>

              <ul>
                <li v-for="item in day.items" :key="item.mealType">
                  <span>
                    <ion-icon aria-hidden="true" :icon="restaurantOutline" />
                  </span>
                  <div>
                    <small>{{ mealLabels[item.mealType] }}</small>
                    <strong>{{ item.menu.name }}</strong>
                  </div>
                  <b>
                    {{ item.menu.nutrition.energyKcal.toLocaleString('id-ID') }}
                    kkal
                  </b>
                </li>
              </ul>

              <button type="button" @click="openDay(day)">
                Lihat dan atur menu hari ini
              </button>
            </article>
          </section>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.weekly-page {
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
  padding:
    calc(var(--app-space-5) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(92px + env(safe-area-inset-bottom));
}

.weekly-header {
  align-items: center;
  display: flex;
  gap: var(--app-space-3);
}

.weekly-header > button {
  align-items: center;
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 50%;
  color: var(--app-text);
  display: flex;
  flex: 0 0 40px;
  height: 40px;
  justify-content: center;
  padding: 0;
}

.weekly-header p,
.section-heading p {
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 3px;
  text-transform: uppercase;
}

.weekly-header h1 {
  color: var(--app-text);
  font-size: 1.65rem;
  letter-spacing: -0.045em;
  margin: 0;
}

.week-picker {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  display: flex;
  gap: var(--app-space-3);
  justify-content: space-between;
  margin-top: var(--app-space-5);
  padding: var(--app-space-3);
}

.week-picker > div {
  align-items: center;
  display: flex;
  gap: 9px;
}

.week-picker ion-icon {
  color: var(--ion-color-primary);
  font-size: 1.4rem;
}

.week-picker span {
  display: grid;
  gap: 2px;
}

.week-picker small {
  color: var(--app-text-muted);
  font-size: 0.56rem;
}

.week-picker strong {
  color: var(--app-text);
  font-size: 0.68rem;
}

.week-picker input {
  background: var(--app-primary-soft);
  border: 0;
  border-radius: var(--app-radius-sm);
  color: var(--ion-color-primary);
  font: inherit;
  font-size: 0.62rem;
  font-weight: 750;
  padding: 9px;
}

.weekly-state {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  display: flex;
  flex-direction: column;
  margin-top: var(--app-space-4);
  min-height: 280px;
  padding: var(--app-space-6);
  text-align: center;
}

.weekly-state > ion-icon,
.weekly-state ion-spinner {
  color: var(--ion-color-primary);
  font-size: 2rem;
  height: 34px;
  width: 34px;
}

.weekly-state h2 {
  color: var(--app-text);
  font-size: 1rem;
  margin: var(--app-space-3) 0 0;
}

.weekly-state p {
  color: var(--app-text-muted);
  font-size: 0.68rem;
  line-height: 1.55;
  margin: 7px 0 0;
}

.weekly-state button,
.day-card > button {
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  color: #ffffff;
  font: inherit;
  font-size: 0.67rem;
  font-weight: 800;
}

.weekly-state button {
  align-items: center;
  display: flex;
  gap: 6px;
  margin-top: var(--app-space-4);
  padding: 11px 16px;
}

.weekly-summary {
  background: linear-gradient(145deg, #1f7253, #174f3d);
  border-radius: var(--app-radius-lg);
  color: #ffffff;
  margin-top: var(--app-space-4);
  padding: var(--app-space-4);
}

.weekly-summary__heading {
  align-items: center;
  display: flex;
  gap: var(--app-space-3);
}

.weekly-summary__heading > span {
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 50%;
  display: flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.weekly-summary__heading ion-icon {
  font-size: 1.45rem;
}

.weekly-summary p {
  font-size: 0.62rem;
  line-height: 1.5;
  margin: var(--app-space-3) 0 0;
  opacity: 0.82;
}

.weekly-summary__heading p {
  margin: 0 0 2px;
}

.weekly-summary h2 {
  font-size: 1rem;
  margin: 0;
}

.weekly-summary__metrics {
  display: grid;
  gap: 1px;
  grid-template-columns: repeat(3, 1fr);
  margin-top: var(--app-space-4);
  overflow: hidden;
}

.weekly-summary__metrics div {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 10px 4px;
}

.weekly-summary__metrics div:first-child {
  border-radius: 12px 0 0 12px;
}

.weekly-summary__metrics div:last-child {
  border-radius: 0 12px 12px 0;
}

.weekly-summary__metrics strong {
  font-size: 1.05rem;
}

.weekly-summary__metrics small {
  font-size: 0.5rem;
  opacity: 0.76;
}

.weekly-list {
  margin-top: var(--app-space-6);
}

.section-heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
}

.section-heading h2 {
  color: var(--app-text);
  font-size: 1.1rem;
  margin: 0;
}

.section-heading > span {
  color: var(--app-text-muted);
  font-size: 0.52rem;
}

.day-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  margin-top: var(--app-space-3);
  overflow: hidden;
  padding: var(--app-space-4);
}

.day-card header {
  align-items: flex-start;
  display: flex;
  gap: var(--app-space-3);
}

.day-card header > span {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  flex: 0 0 auto;
  font-size: 0.5rem;
  font-weight: 800;
  padding: 5px 8px;
}

.day-card h3 {
  color: var(--app-text);
  font-size: 0.78rem;
  margin: 0;
}

.day-card header p {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.55rem;
  gap: 4px;
  margin: 4px 0 0;
}

.day-card ul {
  display: grid;
  gap: 1px;
  list-style: none;
  margin: var(--app-space-3) 0 0;
  padding: 0;
}

.day-card li {
  align-items: center;
  background: var(--app-surface-soft);
  display: grid;
  gap: 9px;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  padding: 8px;
}

.day-card li:first-child {
  border-radius: 12px 12px 0 0;
}

.day-card li:last-child {
  border-radius: 0 0 12px 12px;
}

.day-card li > span {
  align-items: center;
  color: var(--ion-color-primary);
  display: flex;
  font-size: 1rem;
  justify-content: center;
}

.day-card li div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.day-card li small {
  color: var(--app-text-muted);
  font-size: 0.48rem;
}

.day-card li strong {
  color: var(--app-text);
  font-size: 0.6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-card li b {
  color: var(--ion-color-primary);
  font-size: 0.52rem;
  white-space: nowrap;
}

.day-card > button {
  margin-top: var(--app-space-3);
  min-height: 38px;
  width: 100%;
}
</style>
