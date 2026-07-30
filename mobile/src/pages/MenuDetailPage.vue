<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToast,
  onIonViewWillEnter,
} from '@ionic/vue'
import {
  alertCircleOutline,
  arrowBack,
  checkmark,
  flaskOutline,
  hardwareChipOutline,
  informationCircleOutline,
  refreshOutline,
  restaurantOutline,
  ribbonOutline,
  scaleOutline,
  shieldCheckmarkOutline,
  sparkles,
} from 'ionicons/icons'
import NutritionGrid from '@/components/menu/NutritionGrid.vue'
import FeedbackActionBar from '@/components/menu/FeedbackActionBar.vue'
import { useFeedbackStore } from '@/stores/feedback'
import { useMenuDetailStore } from '@/stores/menu-detail'
import { useRecommendationStore } from '@/stores/recommendation'
import type {
  DailyRecommendationItem,
  FeedbackAction,
  MenuMealType,
} from '@/types/domain'

const route = useRoute()
const router = useRouter()
const menuDetailStore = useMenuDetailStore()
const recommendationStore = useRecommendationStore()
const feedbackStore = useFeedbackStore()
const toastOpen = ref(false)
const toastMessage = ref('')

const mealLabels: Record<MenuMealType, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan siang',
  dinner: 'Makan malam',
  snack: 'Camilan',
  all_day: 'Sepanjang hari',
}

const allergenLabels: Record<string, string> = {
  egg: 'Telur',
  fish: 'Ikan',
  milk: 'Susu',
  peanut: 'Kacang tanah',
  shellfish: 'Krustasea dan kerang',
  soy: 'Kedelai',
  tree_nut: 'Kacang pohon',
  wheat: 'Gandum',
}

const menuId = computed(() => {
  const value = route.params.menuId
  return Array.isArray(value) ? value[0] ?? '' : String(value ?? '')
})

const recommendationDate = computed(() =>
  typeof route.query.date === 'string' ? route.query.date : null,
)

const recommendationContext = computed<DailyRecommendationItem | null>(() => {
  const recommendation = recommendationStore.recommendation

  if (
    !recommendation ||
    !recommendationDate.value ||
    recommendation.date !== recommendationDate.value
  ) {
    return null
  }

  return (
    recommendation.items.find((item) => item.menu.id === menuId.value) ?? null
  )
})

const scoreParts = computed(() => {
  const score = recommendationContext.value?.score
  if (!score) return []

  return [
    {
      label: 'Kecocokan kalori',
      maximum: 75,
      value: score.breakdown.calorieFit,
    },
    {
      label: 'Kecocokan preferensi',
      maximum: 20,
      value: score.breakdown.preferenceMatch,
    },
    {
      label: 'Variasi harian',
      maximum: 5,
      value: score.breakdown.dailyRotation,
    },
  ]
})

const loadRecommendationContext = async () => {
  if (!recommendationDate.value) return

  const current = recommendationStore.recommendation
  const alreadyLoaded =
    current?.date === recommendationDate.value &&
    current.items.some((item) => item.menu.id === menuId.value)

  if (!alreadyLoaded) {
    await recommendationStore.fetch(recommendationDate.value)
  }
}

const loadDetail = async () => {
  await Promise.all([
    menuDetailStore.fetch(menuId.value),
    loadRecommendationContext(),
    feedbackStore.fetch(menuId.value),
  ])
}

const handleFeedback = async (action: FeedbackAction) => {
  const feedback = await feedbackStore.toggle(action)

  if (!feedback) {
    toastMessage.value =
      feedbackStore.errorMessage ??
      'Feedback belum dapat disimpan. Silakan coba kembali.'
    toastOpen.value = true
    return
  }

  const messages: Record<FeedbackAction, string> = {
    like: feedback.liked
      ? 'Menu ditandai sebagai menu yang kamu sukai.'
      : 'Status suka dibatalkan.',
    dislike: feedback.disliked
      ? 'Menu akan dihindari pada rekomendasi baru berikutnya.'
      : 'Status tidak suka dibatalkan.',
    consumed: feedback.consumed
      ? 'Menu ditandai sudah dikonsumsi.'
      : 'Status konsumsi dibatalkan.',
  }

  toastMessage.value = messages[action]
  toastOpen.value = true
}

const loadAiExplanation = async () => {
  const context = recommendationContext.value
  const date = recommendationDate.value

  if (!context || !date) return

  await menuDetailStore.fetchAiExplanation({
    date,
    mealType: context.mealType,
    menuId: context.menu.id,
  })
}

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  value.toLocaleString('id-ID', { maximumFractionDigits })

const formatAllergen = (name: string) =>
  allergenLabels[name] ??
  name.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatRole = (role: string) =>
  role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

onIonViewWillEnter(() => {
  void loadDetail()
})
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="menu-detail">
        <header
          v-if="menuDetailStore.loading"
          class="page-status"
          aria-live="polite"
        >
          <button type="button" class="back-button" @click="router.back()">
            <ion-icon aria-hidden="true" :icon="arrowBack" />
            Kembali
          </button>
          <ion-spinner name="crescent" />
          <h1>Memuat detail menu</h1>
          <p>Informasi bahan dan nilai gizi sedang disiapkan.</p>
        </header>

        <header
          v-else-if="menuDetailStore.errorMessage"
          class="page-status page-status--error"
          aria-live="polite"
        >
          <button type="button" class="back-button" @click="router.back()">
            <ion-icon aria-hidden="true" :icon="arrowBack" />
            Kembali
          </button>
          <span class="page-status__icon">
            <ion-icon aria-hidden="true" :icon="alertCircleOutline" />
          </span>
          <h1>Detail menu tidak tersedia</h1>
          <p>{{ menuDetailStore.errorMessage }}</p>
          <button type="button" class="retry-button" @click="loadDetail">
            <ion-icon aria-hidden="true" :icon="refreshOutline" />
            Coba lagi
          </button>
        </header>

        <template v-else-if="menuDetailStore.menu">
          <section class="hero">
            <div class="hero__pattern" aria-hidden="true">
              <ion-icon :icon="restaurantOutline" />
            </div>
            <div class="hero__shade" aria-hidden="true" />

            <button
              class="hero__back"
              type="button"
              aria-label="Kembali"
              @click="router.back()"
            >
              <ion-icon aria-hidden="true" :icon="arrowBack" />
            </button>

            <span v-if="recommendationContext" class="hero__badge">
              <ion-icon aria-hidden="true" :icon="ribbonOutline" />
              Direkomendasikan untukmu
            </span>
          </section>

          <article class="detail-sheet">
            <header class="menu-heading">
              <span class="meal-label">
                {{ mealLabels[menuDetailStore.menu.mealType] }}
              </span>
              <h1>{{ menuDetailStore.menu.name }}</h1>
              <p>{{ menuDetailStore.menu.description }}</p>

              <div class="serving-card">
                <ion-icon aria-hidden="true" :icon="scaleOutline" />
                <div>
                  <span>Porsi penyajian</span>
                  <strong>{{ menuDetailStore.menu.servingDescription }}</strong>
                </div>
                <b>
                  {{ formatNumber(menuDetailStore.menu.servingSizeG) }} g
                </b>
              </div>

              <div v-if="menuDetailStore.menu.tags.length" class="tag-list">
                <span
                  v-for="tag in menuDetailStore.menu.tags"
                  :key="tag"
                >
                  #{{ tag }}
                </span>
              </div>
            </header>

            <nutrition-grid :nutrition="menuDetailStore.menu.nutrition" />

            <section
              v-if="recommendationContext"
              class="recommendation-detail"
              aria-labelledby="recommendation-score-title"
            >
              <div class="recommendation-detail__heading">
                <span>
                  <ion-icon aria-hidden="true" :icon="sparkles" />
                </span>
                <div>
                  <p>Alasan rekomendasi</p>
                  <h2 id="recommendation-score-title">
                    Mengapa menu ini dipilih?
                  </h2>
                </div>
                <strong>
                  {{ formatNumber(recommendationContext.score.total, 2) }}
                  <small>/ 100</small>
                </strong>
              </div>

              <div class="target-summary">
                <div>
                  <span>Target slot</span>
                  <strong>
                    {{ formatNumber(recommendationContext.targetCalories) }}
                    kkal
                  </strong>
                </div>
                <div>
                  <span>Kalori menu</span>
                  <strong>
                    {{
                      formatNumber(
                        recommendationContext.menu.nutrition.energyKcal,
                      )
                    }}
                    kkal
                  </strong>
                </div>
                <div>
                  <span>Selisih</span>
                  <strong>
                    {{ formatNumber(recommendationContext.score.calorieDifference) }}
                    kkal
                  </strong>
                </div>
              </div>

              <div class="score-breakdown">
                <div
                  v-for="part in scoreParts"
                  :key="part.label"
                  class="score-part"
                >
                  <div>
                    <span>{{ part.label }}</span>
                    <strong>
                      {{ formatNumber(part.value, 2) }} / {{ part.maximum }}
                    </strong>
                  </div>
                  <div class="score-bar" aria-hidden="true">
                    <span
                      :style="{
                        width: `${Math.min(100, (part.value / part.maximum) * 100)}%`,
                      }"
                    />
                  </div>
                </div>
              </div>

              <ul class="reason-list">
                <li
                  v-for="reason in recommendationContext.reasons"
                  :key="reason.code"
                >
                  <span>
                    <ion-icon aria-hidden="true" :icon="checkmark" />
                  </span>
                  {{ reason.message }}
                </li>
              </ul>

              <section
                class="ai-explanation"
                aria-labelledby="ai-explanation-title"
              >
                <header>
                  <span>
                    <ion-icon
                      aria-hidden="true"
                      :icon="hardwareChipOutline"
                    />
                  </span>
                  <div>
                    <p>Didukung OpenRouter</p>
                    <h3 id="ai-explanation-title">Penjelasan AI</h3>
                  </div>
                  <b>AI</b>
                </header>

                <div
                  v-if="menuDetailStore.aiLoading"
                  class="ai-explanation__state"
                  aria-live="polite"
                >
                  <ion-spinner name="crescent" />
                  <strong>Menyusun penjelasan personal</strong>
                  <p>
                    AI membaca hasil skor yang sudah diverifikasi oleh backend.
                  </p>
                </div>

                <div
                  v-else-if="menuDetailStore.aiErrorMessage"
                  class="ai-explanation__state ai-explanation__state--error"
                  aria-live="polite"
                >
                  <ion-icon
                    aria-hidden="true"
                    :icon="alertCircleOutline"
                  />
                  <strong>Penjelasan belum tersedia</strong>
                  <p>{{ menuDetailStore.aiErrorMessage }}</p>
                  <button type="button" @click="loadAiExplanation">
                    <ion-icon aria-hidden="true" :icon="refreshOutline" />
                    Coba lagi
                  </button>
                </div>

                <div
                  v-else-if="menuDetailStore.aiExplanation"
                  class="ai-explanation__result"
                >
                  <p>{{ menuDetailStore.aiExplanation.summary }}</p>
                  <ul>
                    <li
                      v-for="highlight in menuDetailStore.aiExplanation
                        .highlights"
                      :key="highlight.title"
                    >
                      <span>
                        <ion-icon aria-hidden="true" :icon="sparkles" />
                      </span>
                      <div>
                        <strong>{{ highlight.title }}</strong>
                        <p>{{ highlight.detail }}</p>
                      </div>
                    </li>
                  </ul>
                  <aside>
                    <ion-icon
                      aria-hidden="true"
                      :icon="informationCircleOutline"
                    />
                    <span>{{ menuDetailStore.aiExplanation.disclaimer }}</span>
                  </aside>
                  <small>
                    Model: {{ menuDetailStore.aiExplanation.model }}
                  </small>
                </div>

                <div v-else class="ai-explanation__intro">
                  <p>
                    Dapatkan penjelasan personal berdasarkan profil, target
                    kalori, komposisi menu, dan rincian skor yang telah
                    diverifikasi.
                  </p>
                  <button type="button" @click="loadAiExplanation">
                    <ion-icon aria-hidden="true" :icon="sparkles" />
                    Buat Penjelasan AI
                  </button>
                  <small>
                    AI tidak dapat mengubah nilai gizi atau keputusan filter
                    alergi.
                  </small>
                </div>
              </section>
            </section>

            <aside
              v-else-if="recommendationDate && !recommendationStore.loading"
              class="context-note"
            >
              <ion-icon aria-hidden="true" :icon="alertCircleOutline" />
              <p>
                Detail katalog berhasil dimuat, tetapi konteks skor rekomendasi
                untuk tanggal ini tidak dapat dipulihkan.
              </p>
            </aside>

            <section class="content-section" aria-labelledby="ingredients-title">
              <div class="content-section__heading">
                <div>
                  <p>Komposisi menu</p>
                  <h2 id="ingredients-title">Bahan makanan</h2>
                </div>
                <span>{{ menuDetailStore.menu.ingredients.length }} bahan</span>
              </div>

              <ul class="ingredient-list">
                <li
                  v-for="ingredient in menuDetailStore.menu.ingredients"
                  :key="`${ingredient.tkpiCode}-${ingredient.name}`"
                >
                  <span class="ingredient-list__check">
                    <ion-icon aria-hidden="true" :icon="checkmark" />
                  </span>
                  <div>
                    <strong>{{ ingredient.name }}</strong>
                    <p>
                      {{ formatNumber(ingredient.amountG) }} g
                      · {{ formatRole(ingredient.componentRole) }}
                    </p>
                    <small v-if="ingredient.preparationNote">
                      {{ ingredient.preparationNote }}
                    </small>
                    <small>
                      TKPI {{ ingredient.tkpiCode }} ·
                      {{ ingredient.sourceReference }}
                    </small>
                  </div>
                </li>
              </ul>
            </section>

            <section class="content-section" aria-labelledby="allergens-title">
              <div class="content-section__heading">
                <div>
                  <p>Informasi keamanan</p>
                  <h2 id="allergens-title">Alergen</h2>
                </div>
                <span>{{ menuDetailStore.menu.allergens.length }} tercatat</span>
              </div>

              <div
                v-if="menuDetailStore.menu.allergens.length"
                class="allergen-list"
              >
                <article
                  v-for="allergen in menuDetailStore.menu.allergens"
                  :key="allergen.name"
                >
                  <ion-icon aria-hidden="true" :icon="alertCircleOutline" />
                  <div>
                    <strong>{{ formatAllergen(allergen.name) }}</strong>
                    <p>{{ allergen.evidence }}</p>
                  </div>
                </article>
              </div>
              <div v-else class="allergen-empty">
                <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
                <p>Tidak ada alergen yang tercatat pada data menu ini.</p>
              </div>
            </section>

            <aside class="source-card">
              <ion-icon aria-hidden="true" :icon="flaskOutline" />
              <div>
                <span>Sumber perhitungan gizi</span>
                <strong>{{ menuDetailStore.menu.nutritionSource }}</strong>
                <small>
                  Versi perhitungan:
                  {{ menuDetailStore.menu.calculationVersion }}
                </small>
              </div>
            </aside>
          </article>
        </template>
      </main>
    </ion-content>

    <ion-footer
      v-if="menuDetailStore.menu"
      class="detail-footer"
    >
      <feedback-action-bar
        :feedback="feedbackStore.feedback"
        :loading="feedbackStore.loading"
        :saving="feedbackStore.saving"
        @feedback="handleFeedback"
      />
    </ion-footer>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :duration="2200"
      position="top"
      color="dark"
      @did-dismiss="toastOpen = false"
    />
  </ion-page>
</template>

<style scoped>
.menu-detail {
  background: var(--app-background);
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
}

.detail-footer {
  box-shadow: none;
}

.hero {
  height: 238px;
  overflow: hidden;
  position: relative;
}

.hero__pattern {
  align-items: center;
  background:
    radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.72), transparent 20%),
    radial-gradient(circle at 85% 75%, rgba(244, 184, 96, 0.3), transparent 27%),
    linear-gradient(145deg, #cfe5d8, #efe5cf);
  display: flex;
  height: 100%;
  justify-content: center;
}

.hero__pattern ion-icon {
  color: rgba(33, 107, 78, 0.42);
  font-size: 4.2rem;
}

.hero__shade {
  background:
    linear-gradient(180deg, rgba(12, 25, 19, 0.38) 0%, transparent 38%),
    linear-gradient(0deg, rgba(12, 25, 19, 0.25) 0%, transparent 36%);
  inset: 0;
  position: absolute;
}

.hero__back {
  align-items: center;
  appearance: none;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 50%;
  color: var(--app-text);
  cursor: pointer;
  display: inline-flex;
  height: 42px;
  justify-content: center;
  left: var(--app-space-5);
  position: absolute;
  top: calc(var(--app-space-4) + env(safe-area-inset-top));
  width: 42px;
}

.hero__back ion-icon {
  font-size: 1.25rem;
}

.hero__badge {
  align-items: center;
  backdrop-filter: blur(10px);
  background: rgba(23, 35, 30, 0.79);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--app-radius-pill);
  bottom: var(--app-space-6);
  color: #ffffff;
  display: flex;
  font-size: 0.65rem;
  font-weight: 800;
  gap: 6px;
  left: var(--app-space-5);
  padding: 8px 11px;
  position: absolute;
}

.hero__badge ion-icon {
  color: #f7bd62;
  font-size: 0.9rem;
}

.detail-sheet {
  background: var(--app-background);
  border-radius: 28px 28px 0 0;
  margin-top: -20px;
  padding:
    var(--app-space-6)
    var(--app-space-5)
    calc(var(--app-space-10) + env(safe-area-inset-bottom));
  position: relative;
  z-index: 1;
}

.menu-heading {
  margin-bottom: var(--app-space-8);
}

.meal-label {
  background: var(--app-primary-soft);
  border: 1px solid #c7e4d4;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  display: inline-block;
  font-size: 0.66rem;
  font-weight: 850;
  padding: 6px 10px;
}

.menu-heading h1 {
  color: var(--app-text);
  font-size: 1.8rem;
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.12;
  margin: var(--app-space-3) 0 var(--app-space-2);
}

.menu-heading > p {
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.55;
  margin: 0;
}

.serving-card {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: auto 1fr auto;
  margin-top: var(--app-space-4);
  padding: var(--app-space-3);
}

.serving-card > ion-icon {
  color: var(--ion-color-primary);
  font-size: 1.25rem;
}

.serving-card div {
  display: grid;
  gap: 2px;
}

.serving-card span {
  color: var(--app-text-muted);
  font-size: 0.55rem;
}

.serving-card strong,
.serving-card b {
  color: var(--app-text);
  font-size: 0.68rem;
}

.serving-card b {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  padding: 6px 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--app-space-3);
}

.tag-list span {
  background: var(--app-surface-soft);
  border-radius: var(--app-radius-pill);
  color: var(--app-text-muted);
  font-size: 0.56rem;
  font-weight: 700;
  padding: 5px 8px;
}

.recommendation-detail {
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.18), transparent 28%),
    var(--app-primary-soft);
  border: 1px solid #c9e3d6;
  border-radius: var(--app-radius-lg);
  margin-top: var(--app-space-8);
  padding: var(--app-space-4);
}

.recommendation-detail__heading {
  align-items: center;
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: auto 1fr auto;
}

.recommendation-detail__heading > span {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 11px;
  color: #ffffff;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.recommendation-detail__heading p,
.content-section__heading p {
  color: var(--ion-color-primary);
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 3px;
  text-transform: uppercase;
}

.recommendation-detail__heading h2,
.content-section__heading h2 {
  color: var(--app-text);
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  margin: 0;
}

.recommendation-detail__heading > strong {
  color: var(--ion-color-primary);
  font-size: 1.15rem;
}

.recommendation-detail__heading > strong small {
  color: var(--app-text-muted);
  display: block;
  font-size: 0.5rem;
  text-align: right;
}

.target-summary {
  display: grid;
  gap: 1px;
  grid-template-columns: repeat(3, 1fr);
  margin-top: var(--app-space-4);
  overflow: hidden;
}

.target-summary div {
  background: rgba(255, 255, 255, 0.62);
  display: grid;
  gap: 3px;
  padding: 10px 6px;
  text-align: center;
}

.target-summary div:first-child {
  border-radius: 10px 0 0 10px;
}

.target-summary div:last-child {
  border-radius: 0 10px 10px 0;
}

.target-summary span {
  color: var(--app-text-muted);
  font-size: 0.5rem;
}

.target-summary strong {
  color: var(--app-text);
  font-size: 0.6rem;
}

.score-breakdown {
  display: grid;
  gap: var(--app-space-3);
  margin-top: var(--app-space-4);
}

.score-part > div:first-child {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.score-part span,
.score-part strong {
  color: var(--app-text-muted);
  font-size: 0.55rem;
}

.score-part strong {
  color: var(--app-text);
}

.score-bar {
  background: rgba(33, 107, 78, 0.12);
  border-radius: var(--app-radius-pill);
  height: 5px;
  overflow: hidden;
}

.score-bar span {
  background: var(--ion-color-primary);
  border-radius: inherit;
  display: block;
  height: 100%;
}

.reason-list,
.ingredient-list {
  display: grid;
  list-style: none;
  margin: 0;
  padding: 0;
}

.reason-list {
  gap: 7px;
  margin-top: var(--app-space-4);
}

.ai-explanation {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(33, 107, 78, 0.18);
  border-radius: var(--app-radius-md);
  margin-top: var(--app-space-4);
  padding: var(--app-space-3);
}

.ai-explanation > header {
  align-items: center;
  display: grid;
  gap: 9px;
  grid-template-columns: 34px minmax(0, 1fr) auto;
}

.ai-explanation > header > span {
  align-items: center;
  background: linear-gradient(145deg, #216b4e, #d69c45);
  border-radius: 10px;
  color: #ffffff;
  display: flex;
  height: 34px;
  justify-content: center;
}

.ai-explanation > header p {
  color: var(--ion-color-primary);
  font-size: 0.48rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  margin: 0 0 2px;
  text-transform: uppercase;
}

.ai-explanation > header h3 {
  color: var(--app-text);
  font-size: 0.82rem;
  margin: 0;
}

.ai-explanation > header b {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-size: 0.5rem;
  padding: 5px 7px;
}

.ai-explanation__intro,
.ai-explanation__state {
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: var(--app-space-4) var(--app-space-2) var(--app-space-2);
  text-align: center;
}

.ai-explanation__intro > p,
.ai-explanation__state p {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  line-height: 1.5;
  margin: 0;
}

.ai-explanation button {
  align-items: center;
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  color: #ffffff;
  display: flex;
  font: inherit;
  font-size: 0.62rem;
  font-weight: 850;
  gap: 6px;
  justify-content: center;
  margin-top: var(--app-space-3);
  min-height: 38px;
  padding: 0 14px;
}

.ai-explanation__intro > small {
  color: var(--app-text-muted);
  font-size: 0.48rem;
  line-height: 1.45;
  margin-top: 7px;
}

.ai-explanation__state {
  min-height: 145px;
  justify-content: center;
}

.ai-explanation__state > ion-icon,
.ai-explanation__state ion-spinner {
  color: var(--ion-color-primary);
  font-size: 1.6rem;
  height: 28px;
  margin-bottom: 9px;
  width: 28px;
}

.ai-explanation__state strong {
  color: var(--app-text);
  font-size: 0.68rem;
  margin-bottom: 4px;
}

.ai-explanation__result {
  margin-top: var(--app-space-3);
}

.ai-explanation__result > p {
  color: var(--app-text);
  font-size: 0.62rem;
  font-weight: 650;
  line-height: 1.55;
  margin: 0;
}

.ai-explanation__result ul {
  display: grid;
  gap: 7px;
  list-style: none;
  margin: var(--app-space-3) 0 0;
  padding: 0;
}

.ai-explanation__result li {
  align-items: flex-start;
  background: var(--app-surface-soft);
  border-radius: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: 24px minmax(0, 1fr);
  padding: 8px;
}

.ai-explanation__result li > span {
  align-items: center;
  color: #d29032;
  display: flex;
  height: 24px;
  justify-content: center;
}

.ai-explanation__result li div {
  display: grid;
  gap: 2px;
}

.ai-explanation__result li strong {
  color: var(--app-text);
  font-size: 0.58rem;
}

.ai-explanation__result li p {
  color: var(--app-text-muted);
  font-size: 0.52rem;
  line-height: 1.45;
  margin: 0;
}

.ai-explanation__result aside {
  align-items: flex-start;
  background: #fff7e9;
  border-radius: 9px;
  color: #7d602f;
  display: flex;
  font-size: 0.48rem;
  gap: 6px;
  line-height: 1.45;
  margin-top: var(--app-space-3);
  padding: 8px;
}

.ai-explanation__result aside ion-icon {
  flex: 0 0 auto;
  font-size: 0.8rem;
}

.ai-explanation__result > small {
  color: var(--app-text-muted);
  display: block;
  font-size: 0.45rem;
  margin-top: 6px;
  text-align: right;
}

.reason-list li {
  align-items: flex-start;
  color: #405149;
  display: flex;
  font-size: 0.58rem;
  gap: 7px;
  line-height: 1.45;
}

.reason-list li > span,
.ingredient-list__check {
  align-items: center;
  background: rgba(33, 107, 78, 0.13);
  border-radius: 50%;
  color: var(--ion-color-primary);
  display: inline-flex;
  flex: 0 0 19px;
  height: 19px;
  justify-content: center;
}

.reason-list ion-icon,
.ingredient-list__check ion-icon {
  font-size: 0.7rem;
}

.context-note,
.source-card,
.allergen-empty {
  align-items: flex-start;
  border-radius: var(--app-radius-md);
  display: flex;
  gap: var(--app-space-2);
  padding: var(--app-space-3);
}

.context-note {
  background: #fff5e8;
  color: #9a5b09;
  margin-top: var(--app-space-6);
}

.context-note p,
.allergen-empty p {
  color: var(--app-text-muted);
  font-size: 0.6rem;
  line-height: 1.45;
  margin: 0;
}

.content-section {
  margin-top: var(--app-space-8);
}

.content-section__heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--app-space-4);
}

.content-section__heading > span {
  color: var(--app-text-muted);
  font-size: 0.62rem;
  font-weight: 700;
}

.ingredient-list {
  gap: var(--app-space-2);
}

.ingredient-list li {
  align-items: flex-start;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: auto 1fr;
  padding: var(--app-space-3);
}

.ingredient-list__check {
  border-radius: 9px;
  height: 28px;
  width: 28px;
}

.ingredient-list li > div {
  display: grid;
  gap: 3px;
}

.ingredient-list strong {
  color: var(--app-text);
  font-size: 0.7rem;
}

.ingredient-list p {
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 700;
  margin: 0;
}

.ingredient-list small {
  color: var(--app-text-muted);
  font-size: 0.53rem;
  line-height: 1.4;
}

.allergen-list {
  display: grid;
  gap: var(--app-space-2);
}

.allergen-list article {
  align-items: flex-start;
  background: #fff4ed;
  border: 1px solid #f2d3c2;
  border-radius: var(--app-radius-md);
  color: #a34829;
  display: flex;
  gap: var(--app-space-2);
  padding: var(--app-space-3);
}

.allergen-list article > ion-icon {
  flex: 0 0 auto;
  font-size: 1rem;
}

.allergen-list strong {
  color: #87391f;
  font-size: 0.67rem;
}

.allergen-list p {
  color: #76584d;
  font-size: 0.56rem;
  line-height: 1.45;
  margin: 3px 0 0;
}

.allergen-empty {
  background: var(--app-primary-soft);
  color: var(--ion-color-primary);
}

.source-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  color: var(--ion-color-primary);
  margin-top: var(--app-space-8);
}

.source-card > ion-icon {
  flex: 0 0 auto;
  font-size: 1.15rem;
}

.source-card div {
  display: grid;
  gap: 3px;
}

.source-card span,
.source-card small {
  color: var(--app-text-muted);
  font-size: 0.54rem;
}

.source-card strong {
  color: var(--app-text);
  font-size: 0.65rem;
}

.page-status {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: calc(var(--app-space-5) + env(safe-area-inset-top));
  text-align: center;
}

.page-status .back-button {
  left: var(--app-space-5);
  position: absolute;
  top: calc(var(--app-space-5) + env(safe-area-inset-top));
}

.page-status ion-spinner {
  color: var(--ion-color-primary);
  height: 36px;
  margin-bottom: var(--app-space-3);
  width: 36px;
}

.page-status__icon {
  align-items: center;
  background: #fff0e8;
  border-radius: 50%;
  color: #b7512d;
  display: inline-flex;
  height: 54px;
  justify-content: center;
  margin-bottom: var(--app-space-3);
  width: 54px;
}

.page-status__icon ion-icon {
  font-size: 1.5rem;
}

.page-status h1 {
  color: var(--app-text);
  font-size: 1.25rem;
  font-weight: 850;
  margin: 0;
}

.page-status > p {
  color: var(--app-text-muted);
  font-size: 0.68rem;
  line-height: 1.55;
  margin: 8px 0 0;
  max-width: 300px;
}

.back-button,
.retry-button {
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
}

.back-button {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  color: var(--app-text);
  min-height: 36px;
  padding: 0 12px;
}

.retry-button {
  background: var(--ion-color-primary);
  border: 0;
  color: #ffffff;
  margin-top: var(--app-space-4);
  min-height: 40px;
  padding: 0 16px;
}
</style>
