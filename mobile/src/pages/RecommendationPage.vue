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
  calendarOutline,
  calendarNumberOutline,
  checkmarkCircle,
  refreshOutline,
  shieldCheckmarkOutline,
  sparkles,
  warningOutline,
} from 'ionicons/icons'
import DailyMealCard from '@/components/recommendation/DailyMealCard.vue'
import AlternativeMenuSheet from '@/components/recommendation/AlternativeMenuSheet.vue'
import ReplacementSuccessBanner from '@/components/recommendation/ReplacementSuccessBanner.vue'
import {
  localDateKey,
  useRecommendationStore,
} from '@/stores/recommendation'
import type {
  DailyRecommendationItem,
  RecommendationMealType,
} from '@/types/domain'

const router = useRouter()
const route = useRoute()
const recommendationStore = useRecommendationStore()
const selectedDate = ref(localDateKey())
const replacementItem = ref<DailyRecommendationItem | null>(null)
const replacementResult = ref<{
  mealLabel: string
  newMenuName: string
  previousMenuName: string
} | null>(null)

const mealMeta: Record<
  RecommendationMealType,
  {
    accent: 'green' | 'amber' | 'blue' | 'rose'
    label: string
    time: string
  }
> = {
  breakfast: {
    accent: 'green',
    label: 'Sarapan',
    time: '07.00 – 09.00',
  },
  lunch: {
    accent: 'amber',
    label: 'Makan siang',
    time: '12.00 – 14.00',
  },
  dinner: {
    accent: 'blue',
    label: 'Makan malam',
    time: '18.00 – 20.00',
  },
  snack: {
    accent: 'rose',
    label: 'Camilan',
    time: '15.00 – 17.00',
  },
}

const recommendation = computed(() => recommendationStore.recommendation)

const recommendedMeals = computed(() =>
  (recommendation.value?.items ?? []).map((item: DailyRecommendationItem) => ({
    ...mealMeta[item.mealType],
    item,
  })),
)

const displayDate = computed(() => {
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return selectedDate.value
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date)
})

const isToday = computed(() => selectedDate.value === localDateKey())

const caloriePercentage = computed(() => {
  const result = recommendation.value
  if (!result || result.dailyTargetCalories <= 0) return 0

  return Math.round(
    (result.totalRecommendedCalories / result.dailyTargetCalories) * 100,
  )
})

const progressWidth = computed(() =>
  Math.min(100, Math.max(0, caloriePercentage.value)),
)

const loadRecommendation = async () => {
  await recommendationStore.fetch(selectedDate.value)
}

const chooseDate = async () => {
  replacementItem.value = null
  replacementResult.value = null
  await loadRecommendation()
}

const openWeeklyPlan = () => {
  router.push({
    name: 'weekly-recommendations',
    query: { start: selectedDate.value },
  })
}

const openProfile = () => {
  router.push({ name: 'profile-edit' })
}

const openMenuDetail = (item: DailyRecommendationItem) => {
  router.push({
    name: 'menu-detail',
    params: { menuId: item.menu.id },
    query: {
      date: selectedDate.value,
      meal: item.mealType,
    },
  })
}

const openAlternatives = async (item: DailyRecommendationItem) => {
  replacementItem.value = item
  await recommendationStore.fetchAlternatives(
    item.mealType,
    item.menu.id,
  )
}

const closeAlternatives = () => {
  replacementItem.value = null
  recommendationStore.clearAlternatives()
}

const retryAlternatives = async () => {
  if (!replacementItem.value) return

  await recommendationStore.fetchAlternatives(
    replacementItem.value.mealType,
    replacementItem.value.menu.id,
  )
}

const showMoreAlternatives = async () => {
  await recommendationStore.fetchMoreAlternatives()
}

const applyConversationFilters = async (message: string) => {
  if (!replacementItem.value) return

  await recommendationStore.fetchConversationalAlternatives(
    replacementItem.value.mealType,
    replacementItem.value.menu.id,
    message,
  )
}

const confirmAlternative = async (
  alternative: DailyRecommendationItem,
) => {
  const current = replacementItem.value
  if (!current) return

  const updated = await recommendationStore.applyAlternative(
    current.mealType,
    alternative,
  )

  if (!updated) return

  replacementResult.value = {
    previousMenuName: current.menu.name,
    newMenuName: alternative.menu.name,
    mealLabel: mealMeta[current.mealType].label,
  }
  replacementItem.value = null
}

onIonViewWillEnter(() => {
  const requestedDate = route.query.date

  if (
    typeof requestedDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
  ) {
    selectedDate.value = requestedDate

    if (recommendationStore.recommendation?.date !== requestedDate) {
      void loadRecommendation()
    }
    return
  }

  if (recommendationStore.recommendation) {
    selectedDate.value = recommendationStore.recommendation.date
    return
  }

  selectedDate.value = localDateKey()
  void loadRecommendation()
})
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="recommendation-page">
        <header class="recommendation-header">
          <div>
            <p>Menu personalmu</p>
            <h1>Rekomendasi harian</h1>
          </div>
          <label class="date-picker" aria-label="Pilih tanggal rekomendasi">
            <ion-icon aria-hidden="true" :icon="calendarOutline" />
            <input
              v-model="selectedDate"
              type="date"
              @change="chooseDate"
            />
          </label>
        </header>

        <div class="date-pill">
          <span>{{ isToday ? 'Hari ini' : 'Tanggal' }}</span>
          <strong>{{ displayDate }}</strong>
          <ion-icon aria-hidden="true" :icon="checkmarkCircle" />
        </div>

        <button
          type="button"
          class="weekly-plan-link"
          @click="openWeeklyPlan"
        >
          <span>
            <ion-icon aria-hidden="true" :icon="calendarNumberOutline" />
          </span>
          <div>
            <strong>Lihat rencana menu 7 hari</strong>
            <small>Ringkasan 28 jadwal makan tanpa menu berulang</small>
          </div>
          <b aria-hidden="true">›</b>
        </button>

        <section
          v-if="recommendationStore.loading"
          class="status-card status-card--loading"
          aria-live="polite"
        >
          <ion-spinner name="crescent" />
          <h2>Menyiapkan menu yang sesuai</h2>
          <p>
            Kami memeriksa target kalori, alergi, makanan yang tidak disukai,
            dan preferensimu.
          </p>
        </section>

        <section
          v-else-if="recommendationStore.hasNoSafeRecommendation"
          class="status-card status-card--safe"
          aria-live="polite"
        >
          <div class="status-card__icon">
            <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
          </div>
          <p class="status-card__eyebrow">Penyaringan keamanan aktif</p>
          <h2>Belum ada kombinasi menu yang aman</h2>
          <p>
            Tidak ada empat menu unik yang lolos seluruh batasan profil untuk
            tanggal ini. Periksa alergi atau makanan yang tidak disukai, lalu
            coba kembali.
          </p>
          <div class="status-actions">
            <button type="button" class="primary-action" @click="openProfile">
              Periksa profil
            </button>
            <button type="button" class="secondary-action" @click="loadRecommendation">
              <ion-icon aria-hidden="true" :icon="refreshOutline" />
              Coba lagi
            </button>
          </div>
        </section>

        <section
          v-else-if="recommendationStore.errorMessage"
          class="status-card status-card--error"
          aria-live="polite"
        >
          <div class="status-card__icon">
            <ion-icon aria-hidden="true" :icon="warningOutline" />
          </div>
          <p class="status-card__eyebrow">Rekomendasi gagal dimuat</p>
          <h2>Ada kendala pada koneksi</h2>
          <p>{{ recommendationStore.errorMessage }}</p>
          <button type="button" class="primary-action" @click="loadRecommendation">
            <ion-icon aria-hidden="true" :icon="refreshOutline" />
            Coba lagi
          </button>
        </section>

        <template v-else-if="recommendation">
          <section class="calorie-summary" aria-labelledby="calorie-summary-title">
            <div class="calorie-summary__top">
              <div>
                <p>Rencana kalori</p>
                <h2 id="calorie-summary-title">
                  {{ recommendation.totalRecommendedCalories.toLocaleString('id-ID') }}
                  <small>
                    /
                    {{ recommendation.dailyTargetCalories.toLocaleString('id-ID') }}
                    kkal
                  </small>
                </h2>
              </div>
              <span>
                <ion-icon aria-hidden="true" :icon="sparkles" />
                {{ caloriePercentage }}% tersusun
              </span>
            </div>
            <div
              class="progress-bar"
              role="progressbar"
              :aria-valuenow="progressWidth"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span :style="{ width: `${progressWidth}%` }" />
            </div>
            <p class="calorie-summary__caption">
              Empat menu dipilih untuk mendekati kebutuhan harianmu.
            </p>
          </section>

          <section class="meal-plan" aria-labelledby="meal-plan-title">
            <replacement-success-banner
              v-if="replacementResult"
              :previous-menu-name="replacementResult.previousMenuName"
              :new-menu-name="replacementResult.newMenuName"
              :meal-label="replacementResult.mealLabel"
              @close="replacementResult = null"
            />

            <div class="section-heading">
              <div>
                <p>Jadwal makan</p>
                <h2 id="meal-plan-title">Menu untuk tanggal ini</h2>
              </div>
              <span>{{ recommendedMeals.length }} menu</span>
            </div>

            <div class="meal-list">
              <daily-meal-card
                v-for="meal in recommendedMeals"
                :key="`${meal.item.mealType}-${meal.item.menu.id}`"
                :item="meal.item"
                :meal-label="meal.label"
                :meal-time="meal.time"
                :accent="meal.accent"
                @select="openMenuDetail(meal.item)"
                @replace="openAlternatives(meal.item)"
              />
            </div>
          </section>

          <aside class="safety-note">
            <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
            <p>
              Filter alergi dan makanan yang tidak disukai telah diterapkan
              berdasarkan profil. Nilai gizi mengikuti data menu yang
              dikurasi.
            </p>
          </aside>
        </template>
      </main>
    </ion-content>

    <alternative-menu-sheet
      v-if="replacementItem"
      :current-item="replacementItem"
      :alternatives="
        recommendationStore.replacementSearch?.alternatives ?? []
      "
      :loading="recommendationStore.replacementLoading"
      :loading-more="recommendationStore.replacementLoadingMore"
      :has-more="recommendationStore.replacementHasMore"
      :more-message="recommendationStore.replacementMoreMessage"
      :interpretation="recommendationStore.replacementInterpretation"
      :saving="recommendationStore.replacementSaving"
      :error-message="recommendationStore.replacementErrorMessage"
      @close="closeAlternatives"
      @retry="retryAlternatives"
      @more="showMoreAlternatives"
      @conversation="applyConversationFilters"
      @confirm="confirmAlternative"
    />
  </ion-page>
</template>

<style scoped>
.recommendation-page {
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
  padding:
    calc(var(--app-space-5) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(var(--app-space-8) + env(safe-area-inset-bottom));
}

.recommendation-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.weekly-plan-link {
  align-items: center;
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  color: var(--app-text);
  display: grid;
  font: inherit;
  gap: var(--app-space-3);
  grid-template-columns: 38px minmax(0, 1fr) auto;
  margin-top: var(--app-space-3);
  padding: 10px;
  text-align: left;
  width: 100%;
}

.weekly-plan-link > span {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 11px;
  color: var(--ion-color-primary);
  display: flex;
  height: 38px;
  justify-content: center;
}

.weekly-plan-link div {
  display: grid;
  gap: 2px;
}

.weekly-plan-link strong {
  font-size: 0.68rem;
}

.weekly-plan-link small {
  color: var(--app-text-muted);
  font-size: 0.53rem;
}

.weekly-plan-link b {
  color: var(--ion-color-primary);
  font-size: 1.25rem;
}

.recommendation-header p,
.section-heading p,
.status-card__eyebrow {
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  text-transform: uppercase;
}

.recommendation-header h1 {
  color: var(--app-text);
  font-size: 1.75rem;
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.1;
  margin: 0;
}

.date-picker {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 50%;
  color: var(--app-text);
  cursor: pointer;
  display: inline-flex;
  height: 42px;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 42px;
}

.date-picker ion-icon {
  font-size: 1.1rem;
}

.date-picker input {
  cursor: pointer;
  height: 100%;
  inset: 0;
  opacity: 0;
  position: absolute;
  width: 100%;
}

.date-pill {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: auto 1fr auto;
  margin-top: var(--app-space-4);
  min-height: 42px;
  padding: 0 var(--app-space-3);
}

.date-pill span,
.section-heading > span {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 850;
  padding: 5px 7px;
}

.date-pill strong {
  color: var(--app-text);
  font-size: 0.68rem;
  text-transform: capitalize;
}

.date-pill ion-icon {
  color: var(--ion-color-primary);
  font-size: 0.95rem;
}

.calorie-summary {
  background:
    radial-gradient(circle at 96% 0%, rgba(240, 168, 75, 0.28), transparent 34%),
    linear-gradient(145deg, #216b4e 0%, #18583f 100%);
  border-radius: var(--app-radius-lg);
  box-shadow: 0 14px 28px rgba(33, 107, 78, 0.18);
  color: #ffffff;
  margin-top: var(--app-space-3);
  padding: var(--app-space-4);
}

.calorie-summary__top {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.calorie-summary__top p {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.62rem;
  font-weight: 750;
  margin: 0 0 4px;
}

.calorie-summary h2 {
  font-size: 1.45rem;
  font-weight: 850;
  letter-spacing: -0.04em;
  margin: 0;
}

.calorie-summary h2 small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0;
}

.calorie-summary__top > span {
  align-items: center;
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--app-radius-pill);
  display: flex;
  font-size: 0.58rem;
  font-weight: 800;
  gap: 5px;
  padding: 7px 8px;
  white-space: nowrap;
}

.calorie-summary__top > span ion-icon {
  color: #f7bd62;
  font-size: 0.8rem;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.16);
  border-radius: var(--app-radius-pill);
  height: 6px;
  margin-top: var(--app-space-3);
  overflow: hidden;
}

.progress-bar span {
  background: #f4b860;
  border-radius: inherit;
  display: block;
  height: 100%;
  transition: width 220ms ease;
}

.calorie-summary__caption {
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.58rem;
  margin: 7px 0 0;
}

.meal-plan {
  margin-top: var(--app-space-5);
}

.section-heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--app-space-3);
}

.section-heading h2 {
  color: var(--app-text);
  font-size: 1.08rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  margin: 0;
}

.meal-list {
  display: grid;
  gap: var(--app-space-3);
}

.safety-note {
  align-items: flex-start;
  background: var(--app-primary-soft);
  border: 1px solid rgba(33, 107, 78, 0.12);
  border-radius: var(--app-radius-md);
  color: var(--ion-color-primary);
  display: flex;
  gap: var(--app-space-2);
  margin-top: var(--app-space-4);
  padding: var(--app-space-3);
}

.safety-note ion-icon {
  flex: 0 0 auto;
  font-size: 1rem;
}

.safety-note p {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  line-height: 1.5;
  margin: 0;
}

.status-card {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  display: flex;
  flex-direction: column;
  margin-top: var(--app-space-4);
  padding: var(--app-space-6) var(--app-space-4);
  text-align: center;
}

.status-card--loading {
  min-height: 260px;
  justify-content: center;
}

.status-card ion-spinner {
  color: var(--ion-color-primary);
  height: 34px;
  margin-bottom: var(--app-space-3);
  width: 34px;
}

.status-card__icon {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 50%;
  color: var(--ion-color-primary);
  display: flex;
  height: 54px;
  justify-content: center;
  margin-bottom: var(--app-space-3);
  width: 54px;
}

.status-card--error .status-card__icon {
  background: #fff0e8;
  color: #b7512d;
}

.status-card__icon ion-icon {
  font-size: 1.55rem;
}

.status-card h2 {
  color: var(--app-text);
  font-size: 1.08rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  margin: 0;
}

.status-card > p:not(.status-card__eyebrow) {
  color: var(--app-text-muted);
  font-size: 0.67rem;
  line-height: 1.6;
  margin: 8px 0 0;
  max-width: 310px;
}

.status-actions {
  display: flex;
  gap: var(--app-space-2);
  justify-content: center;
  margin-top: var(--app-space-4);
}

.primary-action,
.secondary-action {
  align-items: center;
  appearance: none;
  border-radius: var(--app-radius-pill);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.64rem;
  font-weight: 800;
  gap: 5px;
  justify-content: center;
  min-height: 38px;
  padding: 0 16px;
}

.primary-action {
  background: var(--ion-color-primary);
  border: 1px solid var(--ion-color-primary);
  color: #ffffff;
  margin-top: var(--app-space-4);
}

.status-actions .primary-action {
  margin-top: 0;
}

.secondary-action {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  color: var(--app-text);
}

@media (max-width: 360px) {
  .calorie-summary__top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
