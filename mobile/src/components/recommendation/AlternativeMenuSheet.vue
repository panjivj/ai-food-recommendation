<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  checkmark,
  close,
  informationCircleOutline,
  refreshOutline,
  repeatOutline,
  restaurantOutline,
  shieldCheckmarkOutline,
  sparkles,
} from 'ionicons/icons'
import type {
  DailyRecommendationItem,
  ReplacementConversationInterpretation,
} from '@/types/domain'

const props = defineProps<{
  alternatives: DailyRecommendationItem[]
  currentItem: DailyRecommendationItem
  errorMessage: string | null
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  moreMessage: string | null
  interpretation: ReplacementConversationInterpretation | null
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [alternative: DailyRecommendationItem]
  conversation: [message: string]
  more: []
  retry: []
}>()

const selectedMenuId = ref<string | null>(null)
const conversationMessage = ref('')

watch(
  () => props.alternatives,
  (alternatives) => {
    selectedMenuId.value = alternatives[0]?.menu.id ?? null
  },
  { immediate: true },
)

const selectedAlternative = computed(() =>
  props.alternatives.find(
    (item) => item.menu.id === selectedMenuId.value,
  ),
)

const calorieDifferenceLabel = (item: DailyRecommendationItem) => {
  const difference = item.score.calorieDifference
  return `Selisih ${difference.toLocaleString('id-ID')} kkal`
}

const submitConversation = () => {
  const message = conversationMessage.value.trim()

  if (message.length >= 5) {
    emit('conversation', message)
  }
}
</script>

<template>
  <div class="sheet-layer" role="dialog" aria-modal="true">
    <button
      class="sheet-backdrop"
      type="button"
      aria-label="Tutup pilihan alternatif"
      @click="emit('close')"
    />

    <section class="alternative-sheet">
      <div class="sheet-handle" aria-hidden="true" />

      <header class="sheet-header">
        <div>
          <p>Pengganti terkurasi</p>
          <h2>Pilih alternatif menu</h2>
        </div>
        <button type="button" aria-label="Tutup" @click="emit('close')">
          <ion-icon aria-hidden="true" :icon="close" />
        </button>
      </header>

      <div class="current-menu">
        <span>
          <ion-icon aria-hidden="true" :icon="restaurantOutline" />
        </span>
        <div>
          <small>Menu saat ini</small>
          <strong>{{ currentItem.menu.name }}</strong>
        </div>
        <b>
          {{ currentItem.menu.nutrition.energyKcal.toLocaleString('id-ID') }}
          kkal
        </b>
      </div>

      <form class="conversation-assistant" @submit.prevent="submitConversation">
        <div class="conversation-assistant__heading">
          <span>
            <ion-icon aria-hidden="true" :icon="sparkles" />
          </span>
          <div>
            <strong>Minta alternatif dengan AI</strong>
            <small>Jelaskan bahan yang ingin dihindari atau ditambahkan.</small>
          </div>
        </div>
        <textarea
          v-model="conversationMessage"
          rows="2"
          maxlength="500"
          placeholder="Contoh: Saya ingin tanpa talas dan lebih banyak buah."
          :disabled="loading || loadingMore || saving"
          aria-label="Permintaan penggantian menu"
        />
        <button
          type="submit"
          :disabled="
            conversationMessage.trim().length < 5 ||
            loading ||
            loadingMore ||
            saving
          "
        >
          <ion-spinner v-if="loading" name="crescent" />
          <ion-icon v-else aria-hidden="true" :icon="sparkles" />
          Terapkan permintaan
        </button>
        <p>
          AI hanya menerjemahkan permintaan menjadi filter. Pemilihan menu dan
          pemeriksaan keamanan tetap dilakukan backend.
        </p>
      </form>

      <div
        v-if="interpretation"
        class="conversation-filters"
        aria-live="polite"
      >
        <strong>Filter sementara diterapkan</strong>
        <div>
          <span
            v-for="ingredient in interpretation.excludedIngredients"
            :key="`exclude-${ingredient}`"
            class="conversation-filter conversation-filter--excluded"
          >
            Tanpa {{ ingredient }}
          </span>
          <span
            v-for="ingredient in interpretation.preferredIngredients"
            :key="`prefer-${ingredient}`"
            class="conversation-filter"
          >
            Lebih banyak {{ ingredient }}
          </span>
        </div>
        <small>Model: {{ interpretation.model }}</small>
      </div>

      <div v-if="loading" class="sheet-state" aria-live="polite">
        <ion-spinner name="crescent" />
        <strong>Mencari menu pengganti yang aman</strong>
        <p>Filter profil dan target kalori sedang diterapkan.</p>
      </div>

      <div v-else-if="errorMessage" class="sheet-state" aria-live="polite">
        <ion-icon
          class="sheet-state__shield"
          aria-hidden="true"
          :icon="shieldCheckmarkOutline"
        />
        <strong>Alternatif belum tersedia</strong>
        <p>{{ errorMessage }}</p>
        <button type="button" class="retry-button" @click="emit('retry')">
          <ion-icon aria-hidden="true" :icon="refreshOutline" />
          Coba lagi
        </button>
      </div>

      <template v-else>
        <div class="alternative-list">
          <button
            v-for="item in alternatives"
            :key="item.menu.id"
            class="alternative-card"
            :class="{
              'alternative-card--selected':
                selectedMenuId === item.menu.id,
            }"
            type="button"
            @click="selectedMenuId = item.menu.id"
          >
            <span class="alternative-card__visual">
              <ion-icon aria-hidden="true" :icon="restaurantOutline" />
            </span>
            <div class="alternative-card__content">
              <div class="alternative-card__title">
                <h3>{{ item.menu.name }}</h3>
                <span
                  class="radio-indicator"
                  :class="{
                    'radio-indicator--selected':
                      selectedMenuId === item.menu.id,
                  }"
                >
                  <ion-icon
                    v-if="selectedMenuId === item.menu.id"
                    aria-hidden="true"
                    :icon="checkmark"
                  />
                </span>
              </div>
              <p>{{ item.menu.description }}</p>
              <div class="alternative-card__meta">
                <strong>
                  {{ item.menu.nutrition.energyKcal.toLocaleString('id-ID') }}
                  kkal
                </strong>
                <span>{{ calorieDifferenceLabel(item) }}</span>
                <b>Skor {{ item.score.total.toLocaleString('id-ID') }}</b>
              </div>
              <ul>
                <li v-for="reason in item.reasons" :key="reason.code">
                  {{ reason.message }}
                </li>
              </ul>
            </div>
          </button>
        </div>

        <div class="selection-note">
          <ion-icon aria-hidden="true" :icon="informationCircleOutline" />
          <span>
            Menu aktif dan menu lain pada hari ini telah dikecualikan. Alergi,
            dislike, preferensi, dan target kalori tetap diterapkan.
          </span>
        </div>

        <button
          v-if="hasMore"
          class="more-button"
          type="button"
          :disabled="loadingMore || saving"
          @click="emit('more')"
        >
          <ion-spinner v-if="loadingMore" name="crescent" />
          <ion-icon v-else aria-hidden="true" :icon="refreshOutline" />
          {{
            loadingMore
              ? 'Menyiapkan pilihan berikutnya...'
              : 'Tampilkan pilihan lain'
          }}
        </button>

        <p
          v-else-if="moreMessage"
          class="more-message"
          aria-live="polite"
        >
          <ion-icon
            aria-hidden="true"
            :icon="checkmark"
          />
          {{ moreMessage }}
        </p>

        <button
          class="confirm-button"
          type="button"
          :disabled="!selectedAlternative || saving"
          @click="
            selectedAlternative && emit('confirm', selectedAlternative)
          "
        >
          <ion-icon aria-hidden="true" :icon="repeatOutline" />
          {{
            saving
              ? 'Menyimpan penggantian...'
              : `Gunakan ${selectedAlternative?.menu.name ?? 'menu pilihan'}`
          }}
        </button>
      </template>
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
  max-height: 88vh;
  overflow-y: auto;
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
  font-size: 1.3rem;
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

.current-menu {
  align-items: center;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 42px minmax(0, 1fr) auto;
  margin-top: var(--app-space-4);
  padding: 8px;
}

.current-menu > span {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 10px;
  color: var(--ion-color-primary);
  display: flex;
  height: 42px;
  justify-content: center;
}

.current-menu div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.current-menu small {
  color: var(--app-text-muted);
  font-size: 0.53rem;
}

.current-menu strong {
  color: var(--app-text);
  font-size: 0.68rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-menu b {
  color: var(--app-text-muted);
  font-size: 0.56rem;
  white-space: nowrap;
}

.conversation-assistant {
  background: #f7faf8;
  border: 1px solid #cfe3d8;
  border-radius: var(--app-radius-md);
  display: grid;
  gap: 8px;
  margin-top: var(--app-space-3);
  padding: 10px;
}

.conversation-assistant__heading {
  align-items: center;
  display: flex;
  gap: 8px;
}

.conversation-assistant__heading > span {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 9px;
  color: var(--ion-color-primary);
  display: flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
}

.conversation-assistant__heading div {
  display: grid;
  gap: 2px;
}

.conversation-assistant__heading strong {
  color: var(--app-text);
  font-size: 0.66rem;
}

.conversation-assistant__heading small,
.conversation-assistant > p {
  color: var(--app-text-muted);
  font-size: 0.52rem;
  line-height: 1.4;
}

.conversation-assistant textarea {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 10px;
  color: var(--app-text);
  font: inherit;
  font-size: 0.62rem;
  line-height: 1.45;
  padding: 9px;
  resize: vertical;
  width: 100%;
}

.conversation-assistant textarea:focus {
  border-color: var(--ion-color-primary);
  outline: 2px solid rgba(33, 107, 78, 0.1);
}

.conversation-assistant > button {
  align-items: center;
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: 10px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.6rem;
  font-weight: 800;
  gap: 6px;
  justify-content: center;
  min-height: 36px;
}

.conversation-assistant > button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.conversation-assistant > button ion-spinner {
  height: 15px;
  width: 15px;
}

.conversation-assistant > p {
  margin: 0;
}

.conversation-filters {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: 7px;
  margin-top: var(--app-space-3);
  padding: 9px;
}

.conversation-filters > strong {
  color: var(--ion-color-primary);
  font-size: 0.6rem;
}

.conversation-filters > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.conversation-filter {
  background: #ffffff;
  border: 1px solid #b9d9c8;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-size: 0.52rem;
  font-weight: 750;
  padding: 4px 7px;
}

.conversation-filter--excluded {
  border-color: #e7c5bd;
  color: #9b4937;
}

.conversation-filters > small {
  color: var(--app-text-muted);
  font-size: 0.48rem;
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
  grid-template-columns: 58px minmax(0, 1fr);
  overflow: hidden;
  padding: 0;
  text-align: left;
}

.alternative-card--selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(33, 107, 78, 0.1);
}

.alternative-card__visual {
  align-items: center;
  background: linear-gradient(145deg, #dcebe2, #f4e1c4);
  color: rgba(33, 107, 78, 0.55);
  display: flex;
  justify-content: center;
}

.alternative-card__visual ion-icon {
  font-size: 1.45rem;
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
  font-size: 0.75rem;
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

.alternative-card p {
  color: var(--app-text-muted);
  display: -webkit-box;
  font-size: 0.56rem;
  -webkit-line-clamp: 1;
  line-height: 1.4;
  margin: 4px 0 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.alternative-card__meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.alternative-card__meta strong,
.alternative-card__meta b {
  color: var(--ion-color-primary);
  font-size: 0.56rem;
}

.alternative-card__meta span {
  color: var(--app-text-muted);
  font-size: 0.51rem;
}

.alternative-card__meta b {
  margin-left: auto;
}

.alternative-card ul {
  display: grid;
  gap: 3px;
  list-style: none;
  margin: 7px 0 0;
  padding: 0;
}

.alternative-card li {
  color: var(--app-text-muted);
  font-size: 0.5rem;
  line-height: 1.35;
  padding-left: 9px;
  position: relative;
}

.alternative-card li::before {
  color: var(--ion-color-primary);
  content: '•';
  left: 0;
  position: absolute;
}

.selection-note {
  align-items: flex-start;
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-md);
  color: var(--ion-color-primary);
  display: flex;
  font-size: 0.54rem;
  gap: 7px;
  line-height: 1.45;
  margin-top: var(--app-space-3);
  padding: 8px;
}

.selection-note ion-icon {
  flex: 0 0 auto;
  font-size: 0.85rem;
}

.confirm-button,
.more-button,
.retry-button {
  align-items: center;
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 850;
  gap: 7px;
  justify-content: center;
}

.more-button {
  background: var(--app-surface);
  border: 1px solid var(--ion-color-primary);
  color: var(--ion-color-primary);
  margin-top: var(--app-space-3);
  min-height: 42px;
  padding: 0 var(--app-space-3);
  width: 100%;
}

.more-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.more-button ion-spinner {
  height: 17px;
  width: 17px;
}

.more-message {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.56rem;
  gap: 6px;
  justify-content: center;
  line-height: 1.4;
  margin: var(--app-space-3) 0 0;
  text-align: center;
}

.more-message ion-icon {
  color: var(--ion-color-primary);
  flex: 0 0 auto;
}

.confirm-button {
  margin-top: var(--app-space-3);
  min-height: 46px;
  padding: 0 var(--app-space-3);
  width: 100%;
}

.confirm-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.sheet-state {
  align-items: center;
  display: flex;
  flex-direction: column;
  min-height: 210px;
  justify-content: center;
  padding: var(--app-space-5);
  text-align: center;
}

.sheet-state ion-spinner,
.sheet-state__shield {
  color: var(--ion-color-primary);
  font-size: 2rem;
  height: 32px;
  margin-bottom: var(--app-space-3);
  width: 32px;
}

.sheet-state strong {
  color: var(--app-text);
  font-size: 0.76rem;
}

.sheet-state p {
  color: var(--app-text-muted);
  font-size: 0.6rem;
  line-height: 1.5;
  margin: 6px 0 0;
}

.retry-button {
  margin-top: var(--app-space-3);
  min-height: 36px;
  padding: 0 13px;
}
</style>
