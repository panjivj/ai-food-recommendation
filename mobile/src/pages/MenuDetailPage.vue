<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonPage,
  IonToast,
} from '@ionic/vue'
import {
  arrowBack,
  checkmark,
  ribbonOutline,
  sparkles,
  timeOutline,
} from 'ionicons/icons'
import FeedbackActionBar from '@/components/menu/FeedbackActionBar.vue'
import NutritionGrid from '@/components/menu/NutritionGrid.vue'
import { demoMenus } from '@/mocks/menus'
import { useDemoStore } from '@/stores/demo'
import type { FeedbackAction, MealType } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const demoStore = useDemoStore()

const toastOpen = ref(false)
const toastMessage = ref('')

const mealLabels: Record<MealType, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan siang',
  dinner: 'Makan malam',
}

const menu = computed(
  () =>
    demoMenus.find((candidate) => candidate.id === route.params.menuId) ??
    demoMenus[0],
)

const activeFeedback = computed(
  () => demoStore.feedback[menu.value.id] ?? null,
)

const showToast = (message: string) => {
  toastMessage.value = message
  toastOpen.value = true
}

const handleFeedback = (action: FeedbackAction) => {
  demoStore.setFeedback(menu.value.id, action)

  if (!demoStore.feedback[menu.value.id]) {
    showToast('Feedback dibatalkan.')
    return
  }

  const messages: Record<FeedbackAction, string> = {
    like: 'Menu ditambahkan ke pilihan yang kamu sukai.',
    dislike: 'Preferensimu telah diperbarui.',
    consumed: 'Menu ditandai sudah dikonsumsi.',
  }

  showToast(messages[action])
}

const replaceMenu = () => {
  router.push({
    name: 'recommendations',
    query: { replace: menu.value.id },
  })
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="menu-detail">
        <section class="hero">
          <img
            v-if="menu.imageUrl"
            :src="menu.imageUrl"
            :alt="menu.name"
            class="hero__image"
            height="300"
            width="400"
          />
          <div v-else class="hero__fallback" aria-hidden="true" />
          <div class="hero__shade" aria-hidden="true" />

          <button
            class="hero__back"
            type="button"
            aria-label="Kembali"
            @click="router.back()"
          >
            <ion-icon aria-hidden="true" :icon="arrowBack" />
          </button>

          <span class="hero__recommendation-badge">
            <ion-icon aria-hidden="true" :icon="ribbonOutline" />
            Pilihan terbaik
          </span>
        </section>

        <article class="detail-sheet">
          <header class="menu-heading">
            <span class="meal-label">{{ mealLabels[menu.mealType] }}</span>
            <h1>{{ menu.name }}</h1>
            <p>{{ menu.description }}</p>

            <div class="menu-meta">
              <span>
                <ion-icon aria-hidden="true" :icon="timeOutline" />
                {{ menu.preparationMinutes }} menit
              </span>
              <span aria-hidden="true">•</span>
              <span>{{ menu.nutrition.fiberG }} g serat</span>
              <span aria-hidden="true">•</span>
              <span>{{ menu.nutrition.sodiumMg }} mg natrium</span>
            </div>
          </header>

          <nutrition-grid :nutrition="menu.nutrition" />

          <section class="explanation-card" aria-labelledby="explanation-title">
            <span class="explanation-card__icon">
              <ion-icon aria-hidden="true" :icon="sparkles" />
            </span>
            <div>
              <p>Alasan rekomendasi</p>
              <h2 id="explanation-title">Mengapa menu ini cocok?</h2>
              <blockquote>{{ menu.explanation }}</blockquote>
              <small>
                Penjelasan bersifat edukatif dan bukan diagnosis medis.
              </small>
            </div>
          </section>

          <section class="content-section" aria-labelledby="ingredients-title">
            <div class="content-section__heading">
              <div>
                <p>Yang dibutuhkan</p>
                <h2 id="ingredients-title">Bahan makanan</h2>
              </div>
              <span>{{ menu.ingredients.length }} bahan</span>
            </div>

            <ul class="ingredient-list">
              <li v-for="ingredient in menu.ingredients" :key="ingredient">
                <span>
                  <ion-icon aria-hidden="true" :icon="checkmark" />
                </span>
                {{ ingredient }}
              </li>
            </ul>
          </section>

          <section class="content-section" aria-labelledby="steps-title">
            <div class="content-section__heading">
              <div>
                <p>Mudah diikuti</p>
                <h2 id="steps-title">Cara persiapan</h2>
              </div>
              <span>{{ menu.instructions.length }} langkah</span>
            </div>

            <ol class="instruction-list">
              <li
                v-for="(instruction, index) in menu.instructions"
                :key="instruction"
              >
                <span>{{ index + 1 }}</span>
                <p>{{ instruction }}</p>
              </li>
            </ol>
          </section>
        </article>
      </main>
    </ion-content>

    <ion-footer class="detail-footer">
      <feedback-action-bar
        :active-feedback="activeFeedback"
        @feedback="handleFeedback"
        @replace="replaceMenu"
      />
    </ion-footer>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :duration="1800"
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

.hero {
  height: 285px;
  overflow: hidden;
  position: relative;
}

.hero__image,
.hero__fallback {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.hero__fallback {
  background: linear-gradient(135deg, #dcebe2, #f4e1c4);
}

.hero__shade {
  background:
    linear-gradient(180deg, rgba(12, 25, 19, 0.45) 0%, transparent 36%),
    linear-gradient(0deg, rgba(12, 25, 19, 0.3) 0%, transparent 35%);
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

.hero__recommendation-badge {
  align-items: center;
  backdrop-filter: blur(10px);
  background: rgba(23, 35, 30, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--app-radius-pill);
  bottom: var(--app-space-6);
  color: #ffffff;
  display: flex;
  font-size: 0.68rem;
  font-weight: 800;
  gap: 6px;
  left: var(--app-space-5);
  padding: 8px 11px;
  position: absolute;
}

.hero__recommendation-badge ion-icon {
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
  font-size: 0.82rem;
  line-height: 1.55;
  margin: 0;
}

.menu-meta {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.65rem;
  gap: 7px;
  margin-top: var(--app-space-3);
}

.menu-meta span {
  align-items: center;
  display: inline-flex;
  gap: 4px;
}

.menu-meta ion-icon {
  color: var(--ion-color-primary);
  font-size: 0.85rem;
}

.explanation-card {
  align-items: flex-start;
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.18), transparent 32%),
    var(--app-primary-soft);
  border: 1px solid #c9e3d6;
  border-radius: var(--app-radius-lg);
  display: flex;
  gap: var(--app-space-3);
  margin-top: var(--app-space-8);
  padding: var(--app-space-5);
}

.explanation-card__icon {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 12px;
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 40px;
  height: 40px;
  justify-content: center;
}

.explanation-card__icon ion-icon {
  font-size: 1.1rem;
}

.explanation-card p,
.content-section__heading p {
  color: var(--ion-color-primary);
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 3px;
  text-transform: uppercase;
}

.explanation-card h2,
.content-section__heading h2 {
  color: var(--app-text);
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  margin: 0;
}

.explanation-card blockquote {
  color: #405149;
  font-size: 0.76rem;
  line-height: 1.55;
  margin: var(--app-space-3) 0 var(--app-space-2);
}

.explanation-card small {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  line-height: 1.4;
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
  font-size: 0.65rem;
  font-weight: 700;
}

.ingredient-list {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(2, 1fr);
  list-style: none;
  margin: 0;
  padding: 0;
}

.ingredient-list li {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  color: var(--app-text);
  display: flex;
  font-size: 0.72rem;
  font-weight: 700;
  gap: var(--app-space-2);
  min-height: 48px;
  padding: 9px;
}

.ingredient-list li span {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 9px;
  color: var(--ion-color-primary);
  display: inline-flex;
  flex: 0 0 28px;
  height: 28px;
  justify-content: center;
}

.ingredient-list ion-icon {
  font-size: 0.9rem;
}

.instruction-list {
  display: grid;
  gap: var(--app-space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

.instruction-list li {
  align-items: flex-start;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: flex;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
}

.instruction-list li > span {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 10px;
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 30px;
  font-size: 0.72rem;
  font-weight: 850;
  height: 30px;
  justify-content: center;
}

.instruction-list p {
  color: var(--app-text-muted);
  font-size: 0.74rem;
  line-height: 1.55;
  margin: 4px 0 0;
}

.detail-footer {
  box-shadow: none;
}
</style>
