<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { notificationsOutline, shieldCheckmarkOutline } from 'ionicons/icons'
import CalorieSummaryCard from '@/components/home/CalorieSummaryCard.vue'
import MealRecommendationCard from '@/components/home/MealRecommendationCard.vue'
import { demoMenus } from '@/mocks/menus'
import { useDemoStore } from '@/stores/demo'
import type { MealType, Menu } from '@/types/domain'

const router = useRouter()
const demoStore = useDemoStore()

const mealMeta: Record<MealType, { label: string; time: string }> = {
  breakfast: { label: 'Sarapan', time: '07.00 – 09.00' },
  lunch: { label: 'Makan siang', time: '12.00 – 14.00' },
  dinner: { label: 'Makan malam', time: '18.00 – 20.00' },
}

const recommendedMenus = computed(() =>
  (Object.keys(demoStore.recommendation.menuIds) as MealType[])
    .map((mealType) => {
      const menu = demoMenus.find(
        (candidate) => candidate.id === demoStore.recommendation.menuIds[mealType],
      )

      return menu ? { menu, ...mealMeta[mealType] } : null
    })
    .filter(
      (
        item,
      ): item is {
        menu: Menu
        label: string
        time: string
      } => item !== null,
    ),
)

const nutritionSummary = computed(() =>
  recommendedMenus.value.reduce(
    (summary, item) => ({
      calories: summary.calories + item.menu.nutrition.calories,
      protein: summary.protein + item.menu.nutrition.proteinG,
      carbohydrate:
        summary.carbohydrate + item.menu.nutrition.carbohydrateG,
      fat: summary.fat + item.menu.nutrition.fatG,
    }),
    { calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
  ),
)

const firstName = computed(() => demoStore.user.name.split(' ')[0])
const initials = computed(() =>
  demoStore.user.name
    .split(' ')
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join(''),
)

const openMenuDetail = (menuId: string) => {
  router.push({ name: 'menu-detail', params: { menuId } })
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="home-page">
        <header class="home-header">
          <div class="brand">
            <span class="brand__mark" aria-hidden="true">N</span>
            <span>NutriChoice</span>
          </div>

          <div class="header-actions">
            <button class="icon-button" type="button" aria-label="Notifikasi">
              <ion-icon aria-hidden="true" :icon="notificationsOutline" />
              <span class="icon-button__dot" aria-hidden="true" />
            </button>
            <button
              class="avatar"
              type="button"
              aria-label="Buka profil"
              @click="router.push('/app/profile')"
            >
              {{ initials }}
            </button>
          </div>
        </header>

        <section class="greeting">
          <p>Sabtu, 25 Juli</p>
          <h1>Selamat pagi, {{ firstName }} <span aria-hidden="true">👋</span></h1>
          <span>Ini pilihan makanan terbaik untukmu hari ini.</span>
        </section>

        <calorie-summary-card
          :planned-calories="nutritionSummary.calories"
          :calorie-target="demoStore.recommendation.calorieTarget"
          :protein="nutritionSummary.protein"
          :carbohydrate="nutritionSummary.carbohydrate"
          :fat="nutritionSummary.fat"
        />

        <section class="recommendation-section" aria-labelledby="recommendation-title">
          <div class="section-heading">
            <div>
              <p>Disusun untukmu</p>
              <h2 id="recommendation-title">Rekomendasi hari ini</h2>
            </div>
            <button
              type="button"
              @click="router.push('/app/recommendations')"
            >
              Lihat semua
            </button>
          </div>

          <div class="meal-carousel">
            <meal-recommendation-card
              v-for="item in recommendedMenus"
              :key="item.menu.id"
              :menu="item.menu"
              :meal-label="item.label"
              :meal-time="item.time"
              @select="openMenuDetail"
            />
          </div>
        </section>

        <aside class="recommendation-note">
          <span>
            <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
          </span>
          <div>
            <strong>Dipilih berdasarkan profilmu</strong>
            <p>
              Rekomendasi mempertimbangkan target, aktivitas, alergi, dan
              preferensi makanan demo.
            </p>
          </div>
        </aside>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.home-page {
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  padding:
    calc(var(--app-space-4) + env(safe-area-inset-top))
    0
    calc(var(--app-space-10) + env(safe-area-inset-bottom));
}

.home-header,
.greeting,
.calorie-card,
.section-heading,
.recommendation-note {
  margin-left: var(--app-space-5);
  margin-right: var(--app-space-5);
}

.home-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.brand {
  align-items: center;
  color: var(--app-text);
  display: flex;
  font-size: 1rem;
  font-weight: 850;
  gap: var(--app-space-2);
  letter-spacing: -0.03em;
}

.brand__mark {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 11px 11px 11px 4px;
  color: #ffffff;
  display: inline-flex;
  font-size: 0.8rem;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.header-actions {
  align-items: center;
  display: flex;
  gap: var(--app-space-2);
}

.icon-button,
.avatar {
  align-items: center;
  appearance: none;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
}

.icon-button {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 50%;
  color: var(--app-text);
  height: 40px;
  position: relative;
  width: 40px;
}

.icon-button ion-icon {
  font-size: 1.2rem;
}

.icon-button__dot {
  background: #e06c5c;
  border: 2px solid var(--app-surface);
  border-radius: 50%;
  height: 8px;
  position: absolute;
  right: 8px;
  top: 7px;
  width: 8px;
}

.avatar {
  background: var(--app-accent-soft);
  border: 1px solid #f4d7aa;
  border-radius: 50%;
  color: #86520e;
  font-size: 0.72rem;
  font-weight: 900;
  height: 40px;
  width: 40px;
}

.greeting {
  padding: var(--app-space-6) 0 var(--app-space-5);
}

.greeting p {
  color: var(--ion-color-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

.greeting h1 {
  color: var(--app-text);
  font-size: 1.75rem;
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.15;
  margin: 0;
}

.greeting h1 span {
  font-size: 1.35rem;
}

.greeting > span {
  color: var(--app-text-muted);
  display: block;
  font-size: 0.82rem;
  line-height: 1.5;
  margin-top: 7px;
}

.recommendation-section {
  padding-top: var(--app-space-8);
}

.section-heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--app-space-4);
}

.section-heading p {
  color: var(--ion-color-primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  margin: 0 0 4px;
  text-transform: uppercase;
}

.section-heading h2 {
  color: var(--app-text);
  font-size: 1.25rem;
  font-weight: 850;
  letter-spacing: -0.035em;
  margin: 0;
}

.section-heading button {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--ion-color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 8px 0 4px 12px;
}

.meal-carousel {
  display: flex;
  gap: var(--app-space-3);
  overflow-x: auto;
  padding: 0 var(--app-space-5) var(--app-space-3);
  scroll-padding-left: var(--app-space-5);
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.meal-carousel::-webkit-scrollbar {
  display: none;
}

.meal-carousel :deep(.meal-card) {
  scroll-snap-align: start;
}

.recommendation-note {
  align-items: flex-start;
  background: var(--app-primary-soft);
  border: 1px solid #cee6d9;
  border-radius: var(--app-radius-lg);
  display: flex;
  gap: var(--app-space-3);
  margin-top: var(--app-space-5);
  padding: var(--app-space-4);
}

.recommendation-note > span {
  align-items: center;
  background: var(--app-surface);
  border-radius: var(--app-radius-sm);
  color: var(--ion-color-primary);
  display: inline-flex;
  flex: 0 0 36px;
  height: 36px;
  justify-content: center;
}

.recommendation-note ion-icon {
  font-size: 1.15rem;
}

.recommendation-note strong {
  color: var(--app-text);
  font-size: 0.8rem;
}

.recommendation-note p {
  color: var(--app-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
  margin: 4px 0 0;
}
</style>
