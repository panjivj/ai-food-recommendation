<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  checkmark,
  close,
  informationCircleOutline,
  repeatOutline,
  timeOutline,
} from 'ionicons/icons'
import type { Menu } from '@/types/domain'

const props = defineProps<{
  currentMenu: Menu
  alternatives: Menu[]
}>()

const emit = defineEmits<{
  close: []
  confirm: [menuId: string]
}>()

const selectedMenuId = ref(props.alternatives[0]?.id ?? '')

const selectedMenu = computed(
  () =>
    props.alternatives.find((menu) => menu.id === selectedMenuId.value) ??
    props.alternatives[0],
)

const calorieDifference = (menu: Menu) =>
  menu.nutrition.calories - props.currentMenu.nutrition.calories

const differenceLabel = (menu: Menu) => {
  const difference = calorieDifference(menu)
  if (difference === 0) return 'Kalori setara'
  return `${difference > 0 ? '+' : '−'}${Math.abs(difference)} kkal`
}
</script>

<template>
  <div class="sheet-layer" role="presentation">
    <button
      class="sheet-backdrop"
      type="button"
      aria-label="Tutup pilihan alternatif"
      @click="emit('close')"
    />

    <section
      class="alternative-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alternative-title"
    >
      <div class="sheet-handle" aria-hidden="true" />

      <header class="sheet-header">
        <div>
          <p>Ganti rekomendasi</p>
          <h2 id="alternative-title">Pilih menu alternatif</h2>
        </div>
        <button type="button" aria-label="Tutup" @click="emit('close')">
          <ion-icon aria-hidden="true" :icon="close" />
        </button>
      </header>

      <div class="current-menu">
        <img
          :src="currentMenu.imageUrl"
          :alt="currentMenu.name"
          height="56"
          width="56"
        />
        <div>
          <span>Menu yang akan diganti</span>
          <strong>{{ currentMenu.name }}</strong>
        </div>
        <span class="current-menu__calories">
          {{ currentMenu.nutrition.calories }} kkal
        </span>
      </div>

      <div class="alternative-list" role="radiogroup" aria-label="Menu alternatif">
        <button
          v-for="menu in alternatives"
          :key="menu.id"
          class="alternative-card"
          :class="{ 'alternative-card--selected': selectedMenuId === menu.id }"
          type="button"
          role="radio"
          :aria-checked="selectedMenuId === menu.id"
          @click="selectedMenuId = menu.id"
        >
          <img :src="menu.imageUrl" :alt="menu.name" height="92" width="92" />
          <div class="alternative-card__content">
            <div class="alternative-card__title">
              <h3>{{ menu.name }}</h3>
              <span
                class="radio-indicator"
                :class="{ 'radio-indicator--selected': selectedMenuId === menu.id }"
              >
                <ion-icon
                  v-if="selectedMenuId === menu.id"
                  aria-hidden="true"
                  :icon="checkmark"
                />
              </span>
            </div>
            <p>{{ menu.description }}</p>
            <div class="alternative-card__meta">
              <strong>{{ menu.nutrition.calories }} kkal</strong>
              <span>
                <ion-icon aria-hidden="true" :icon="timeOutline" />
                {{ menu.preparationMinutes }} menit
              </span>
              <span
                class="calorie-difference"
                :class="{ positive: calorieDifference(menu) > 0 }"
              >
                {{ differenceLabel(menu) }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <div class="selection-note">
        <ion-icon aria-hidden="true" :icon="informationCircleOutline" />
        <span>
          Semua alternatif menggunakan data dummy dan tetap mengikuti batasan
          alergi profil demo.
        </span>
      </div>

      <button
        class="confirm-button"
        type="button"
        :disabled="!selectedMenu"
        @click="selectedMenu && emit('confirm', selectedMenu.id)"
      >
        <ion-icon aria-hidden="true" :icon="repeatOutline" />
        Gunakan {{ selectedMenu?.name ?? 'menu pilihan' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.sheet-layer {
  inset: 0;
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  position: fixed;
  z-index: 1000;
}

.sheet-backdrop {
  appearance: none;
  backdrop-filter: blur(2px);
  background: rgba(16, 30, 23, 0.58);
  border: 0;
  cursor: pointer;
  inset: 0;
  padding: 0;
  position: absolute;
  width: 100%;
}

.alternative-sheet {
  background: var(--app-background);
  border-radius: 28px 28px 0 0;
  bottom: 0;
  box-shadow: 0 -20px 50px rgba(17, 44, 32, 0.2);
  left: 0;
  padding:
    var(--app-space-3)
    var(--app-space-5)
    calc(var(--app-space-4) + env(safe-area-inset-bottom));
  position: absolute;
  right: 0;
}

.sheet-handle {
  background: #cbd5cf;
  border-radius: var(--app-radius-pill);
  height: 4px;
  margin: 0 auto var(--app-space-3);
  width: 42px;
}

.sheet-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.sheet-header p {
  color: var(--ion-color-primary);
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 3px;
  text-transform: uppercase;
}

.sheet-header h2 {
  color: var(--app-text);
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -0.04em;
  margin: 0;
}

.sheet-header button {
  align-items: center;
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 50%;
  color: var(--app-text);
  cursor: pointer;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  padding: 0;
  width: 38px;
}

.sheet-header button ion-icon {
  font-size: 1.05rem;
}

.current-menu {
  align-items: center;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 52px minmax(0, 1fr) auto;
  margin-top: var(--app-space-4);
  padding: 7px;
}

.current-menu img {
  border-radius: 11px;
  height: 52px;
  object-fit: cover;
  width: 52px;
}

.current-menu div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.current-menu div span {
  color: var(--app-text-muted);
  font-size: 0.55rem;
}

.current-menu strong {
  color: var(--app-text);
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-menu__calories {
  background: var(--app-surface);
  border-radius: var(--app-radius-pill);
  color: var(--app-text-muted);
  font-size: 0.58rem;
  font-weight: 800;
  padding: 6px 8px;
}

.alternative-list {
  display: grid;
  gap: var(--app-space-2);
  margin-top: var(--app-space-4);
}

.alternative-card {
  align-items: stretch;
  appearance: none;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  color: var(--app-text);
  cursor: pointer;
  display: grid;
  font: inherit;
  grid-template-columns: 92px minmax(0, 1fr);
  overflow: hidden;
  padding: 0;
  text-align: left;
}

.alternative-card--selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(33, 107, 78, 0.1);
}

.alternative-card > img {
  height: 100%;
  min-height: 105px;
  object-fit: cover;
  width: 92px;
}

.alternative-card__content {
  min-width: 0;
  padding: var(--app-space-3);
}

.alternative-card__title {
  align-items: flex-start;
  display: flex;
  gap: var(--app-space-2);
  justify-content: space-between;
}

.alternative-card h3 {
  color: var(--app-text);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  margin: 0;
}

.radio-indicator {
  align-items: center;
  border: 1.5px solid #bdc9c2;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 20px;
  height: 20px;
  justify-content: center;
}

.radio-indicator--selected {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
}

.radio-indicator ion-icon {
  font-size: 0.75rem;
}

.alternative-card p {
  color: var(--app-text-muted);
  display: -webkit-box;
  font-size: 0.58rem;
  -webkit-line-clamp: 1;
  line-height: 1.4;
  margin: 5px 0 8px;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.alternative-card__meta {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.52rem;
  gap: 6px;
}

.alternative-card__meta strong {
  color: var(--ion-color-primary);
  font-size: 0.6rem;
}

.alternative-card__meta > span {
  align-items: center;
  display: inline-flex;
  gap: 3px;
}

.calorie-difference {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-weight: 850;
  padding: 4px 6px;
}

.calorie-difference.positive {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

.selection-note {
  align-items: flex-start;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.56rem;
  gap: 6px;
  line-height: 1.4;
  margin: var(--app-space-3) 2px;
}

.selection-note ion-icon {
  color: var(--ion-color-primary);
  flex: 0 0 auto;
  font-size: 0.85rem;
}

.confirm-button {
  align-items: center;
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 850;
  gap: 7px;
  justify-content: center;
  min-height: 50px;
  overflow: hidden;
  padding: 0 var(--app-space-4);
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.confirm-button ion-icon {
  flex: 0 0 auto;
  font-size: 0.95rem;
}
</style>
