<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, IonToast } from '@ionic/vue'
import {
  calendarOutline,
  checkmarkCircle,
  informationCircleOutline,
  sparkles,
} from 'ionicons/icons'
import DailyMealCard from '@/components/recommendation/DailyMealCard.vue'
import AlternativeMenuSheet from '@/components/recommendation/AlternativeMenuSheet.vue'
import ReplacementSuccessBanner from '@/components/recommendation/ReplacementSuccessBanner.vue'
import { demoMenus } from '@/mocks/menus'
import { useDemoStore } from '@/stores/demo'
import type { MealType, Menu } from '@/types/domain'

const router = useRouter()
const route = useRoute()
const demoStore = useDemoStore()
const toastOpen = ref(false)
const toastMessage = ref('')
const replacementResult = ref<{
  previousMenuName: string
  newMenuName: string
  mealLabel: string
} | null>(null)

const mealMeta: Record<
  MealType,
  {
    label: string
    time: string
    accent: 'green' | 'amber' | 'blue'
  }
> = {
  breakfast: {
    label: 'Sarapan',
    time: '07.00 – 09.00',
    accent: 'green',
  },
  lunch: {
    label: 'Makan siang',
    time: '12.00 – 14.00',
    accent: 'amber',
  },
  dinner: {
    label: 'Makan malam',
    time: '18.00 – 20.00',
    accent: 'blue',
  },
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
        accent: 'green' | 'amber' | 'blue'
      } => item !== null,
    ),
)

const totalCalories = computed(() =>
  recommendedMenus.value.reduce(
    (total, item) => total + item.menu.nutrition.calories,
    0,
  ),
)

const caloriePercentage = computed(() =>
  Math.round(
    (totalCalories.value / demoStore.recommendation.calorieTarget) * 100,
  ),
)

const menuToReplace = computed(() => {
  const menuId = route.query.replace
  return typeof menuId === 'string'
    ? demoMenus.find((menu) => menu.id === menuId)
    : undefined
})

const alternativeMenus = computed(() =>
  demoStore.recommendation.alternativeMenuIds
    .map((menuId) => demoMenus.find((menu) => menu.id === menuId))
    .filter((menu): menu is Menu => menu !== undefined),
)

const openMenuDetail = (menuId: string) => {
  router.push({ name: 'menu-detail', params: { menuId } })
}

const closeAlternatives = () => {
  router.replace({ name: 'recommendations' })
}

const confirmAlternative = (menuId: string) => {
  if (!menuToReplace.value) return

  const mealType = (
    Object.entries(demoStore.recommendation.menuIds) as [MealType, string][]
  ).find(([, currentMenuId]) => currentMenuId === menuToReplace.value?.id)?.[0]

  const selectedMenu = demoMenus.find((menu) => menu.id === menuId)
  if (!mealType || !selectedMenu) return

  replacementResult.value = {
    previousMenuName: menuToReplace.value.name,
    newMenuName: selectedMenu.name,
    mealLabel: mealMeta[mealType].label,
  }
  demoStore.replaceMenu(mealType, menuId)
  toastMessage.value = `${selectedMenu.name} berhasil digunakan sebagai menu ${mealMeta[mealType].label.toLowerCase()}.`
  toastOpen.value = true
  closeAlternatives()
}
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
          <button type="button" aria-label="Pilih tanggal">
            <ion-icon aria-hidden="true" :icon="calendarOutline" />
          </button>
        </header>

        <div class="date-pill">
          <span>Hari ini</span>
          <strong>Sabtu, 25 Juli 2026</strong>
          <ion-icon aria-hidden="true" :icon="checkmarkCircle" />
        </div>

        <section class="calorie-summary" aria-labelledby="calorie-summary-title">
          <div class="calorie-summary__top">
            <div>
              <p>Rencana kalori</p>
              <h2 id="calorie-summary-title">
                {{ totalCalories.toLocaleString('id-ID') }}
                <small>
                  / {{ demoStore.recommendation.calorieTarget.toLocaleString('id-ID') }}
                  kkal
                </small>
              </h2>
            </div>
            <span>
              <ion-icon aria-hidden="true" :icon="sparkles" />
              {{ caloriePercentage }}% tersusun
            </span>
          </div>
          <div class="progress-bar" aria-hidden="true">
            <span :style="{ width: `${caloriePercentage}%` }" />
          </div>
          <p class="calorie-summary__caption">
            Tiga menu dipilih untuk mendekati kebutuhan harianmu.
          </p>
        </section>

        <replacement-success-banner
          v-if="replacementResult"
          :previous-menu-name="replacementResult.previousMenuName"
          :new-menu-name="replacementResult.newMenuName"
          :meal-label="replacementResult.mealLabel"
          @close="replacementResult = null"
        />

        <section class="meal-plan" aria-labelledby="meal-plan-title">
          <div class="section-heading">
            <div>
              <p>Jadwal makan</p>
              <h2 id="meal-plan-title">Menu untuk hari ini</h2>
            </div>
            <span>{{ recommendedMenus.length }} menu</span>
          </div>

          <div class="meal-list">
            <daily-meal-card
              v-for="item in recommendedMenus"
              :key="item.menu.id"
              :menu="item.menu"
              :meal-label="item.label"
              :meal-time="item.time"
              :accent="item.accent"
              @select="openMenuDetail"
            />
          </div>
        </section>

        <aside v-if="!replacementResult" class="demo-note">
          <ion-icon aria-hidden="true" :icon="informationCircleOutline" />
          <p>
            Menu menggunakan data dummy dan dapat dibuka untuk melihat detail
            nutrisi serta alasan rekomendasi.
          </p>
        </aside>
      </main>
    </ion-content>

    <alternative-menu-sheet
      v-if="menuToReplace && alternativeMenus.length"
      :current-menu="menuToReplace"
      :alternatives="alternativeMenus"
      @close="closeAlternatives"
      @confirm="confirmAlternative"
    />

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
.recommendation-page {
  margin: 0 auto;
  max-width: var(--app-mobile-width);
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

.recommendation-header p,
.section-heading p {
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

.recommendation-header button {
  align-items: center;
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 50%;
  color: var(--app-text);
  cursor: pointer;
  display: inline-flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.recommendation-header ion-icon {
  font-size: 1.1rem;
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

.date-pill span {
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

.section-heading > span {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 850;
  padding: 6px 8px;
}

.meal-list {
  display: grid;
  gap: var(--app-space-2);
}

.demo-note {
  align-items: flex-start;
  background: var(--app-primary-soft);
  border: 1px solid #c9e3d6;
  border-radius: var(--app-radius-md);
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.6rem;
  gap: var(--app-space-2);
  line-height: 1.45;
  margin-top: var(--app-space-3);
  padding: var(--app-space-3);
}

.demo-note ion-icon {
  color: var(--ion-color-primary);
  flex: 0 0 auto;
  font-size: 0.95rem;
}

.demo-note p {
  margin: 0;
}

@media (max-height: 860px) {
  .recommendation-page {
    padding-top: calc(var(--app-space-4) + env(safe-area-inset-top));
  }

  .recommendation-header h1 {
    font-size: 1.55rem;
  }

  .date-pill {
    margin-top: var(--app-space-3);
  }

  .meal-plan {
    margin-top: var(--app-space-4);
  }
}
</style>
