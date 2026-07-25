<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/vue'
import {
  arrowBack,
  checkmarkCircleOutline,
  cloudOfflineOutline,
  informationCircleOutline,
  personCircleOutline,
  refreshOutline,
  restaurantOutline,
} from 'ionicons/icons'

type DemoState = 'loading' | 'empty' | 'error'

const route = useRoute()
const router = useRouter()

const validStates: DemoState[] = ['loading', 'empty', 'error']
const activeState = computed<DemoState>(() => {
  const requestedState = route.query.state
  return typeof requestedState === 'string' &&
    validStates.includes(requestedState as DemoState)
    ? (requestedState as DemoState)
    : 'loading'
})

const setState = (state: DemoState) => {
  router.replace({ name: 'system-states', query: { state } })
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <main class="states-page">
        <header class="states-header">
          <button
            type="button"
            aria-label="Kembali ke rekomendasi"
            @click="router.push('/app/recommendations')"
          >
            <ion-icon aria-hidden="true" :icon="arrowBack" />
          </button>
          <div>
            <p>Dokumentasi antarmuka</p>
            <h1>System states</h1>
          </div>
          <span>Demo UI</span>
        </header>

        <nav class="state-switcher" aria-label="Pilih kondisi tampilan">
          <button
            type="button"
            :class="{ active: activeState === 'loading' }"
            @click="setState('loading')"
          >
            Loading
          </button>
          <button
            type="button"
            :class="{ active: activeState === 'empty' }"
            @click="setState('empty')"
          >
            Empty
          </button>
          <button
            type="button"
            :class="{ active: activeState === 'error' }"
            @click="setState('error')"
          >
            Error
          </button>
        </nav>

        <section class="preview-frame">
          <header class="preview-header">
            <div>
              <p>Rekomendasi personalmu</p>
              <h2>Menu hari ini</h2>
            </div>
            <span>Sabtu, 25 Juli</span>
          </header>

          <template v-if="activeState === 'loading'">
            <section class="loading-state" aria-live="polite">
              <span class="state-icon state-icon--loading">
                <ion-spinner name="crescent" />
              </span>
              <p>Menganalisis profilmu</p>
              <h3>Menyusun rekomendasi terbaik...</h3>
              <span>
                Kami sedang mencocokkan target kalori, preferensi, dan batasan
                makananmu.
              </span>
            </section>

            <div class="skeleton-summary">
              <span class="skeleton skeleton--short" />
              <span class="skeleton skeleton--title" />
              <span class="skeleton skeleton--progress" />
            </div>

            <div class="skeleton-list">
              <div v-for="item in 3" :key="item" class="skeleton-card">
                <span class="skeleton skeleton--image" />
                <span>
                  <i class="skeleton skeleton--short" />
                  <i class="skeleton skeleton--line" />
                  <i class="skeleton skeleton--medium" />
                </span>
              </div>
            </div>
          </template>

          <template v-else-if="activeState === 'empty'">
            <section class="central-state">
              <span class="state-icon">
                <ion-icon aria-hidden="true" :icon="restaurantOutline" />
              </span>
              <p>Belum ada rekomendasi</p>
              <h3>Lengkapi profil untuk memulai</h3>
              <span>
                Kami memerlukan data tubuh, tujuan, dan preferensi sebelum
                menyusun pilihan menu harian.
              </span>
              <button type="button" @click="router.push('/profile/setup')">
                <ion-icon aria-hidden="true" :icon="personCircleOutline" />
                Lengkapi profil
              </button>
            </section>

            <div class="state-details">
              <div>
                <ion-icon aria-hidden="true" :icon="checkmarkCircleOutline" />
                Data tubuh dan aktivitas
              </div>
              <div>
                <ion-icon aria-hidden="true" :icon="checkmarkCircleOutline" />
                Tujuan dan preferensi
              </div>
              <div>
                <ion-icon aria-hidden="true" :icon="checkmarkCircleOutline" />
                Kondisi kesehatan dan alergi
              </div>
            </div>
          </template>

          <template v-else>
            <section class="central-state central-state--error">
              <span class="state-icon state-icon--error">
                <ion-icon aria-hidden="true" :icon="cloudOfflineOutline" />
              </span>
              <p>Terjadi kendala</p>
              <h3>Rekomendasi belum dapat dimuat</h3>
              <span>
                Periksa koneksi atau coba lagi. Data profil demo tetap tersimpan
                dengan aman di perangkat.
              </span>
              <button type="button" @click="setState('loading')">
                <ion-icon aria-hidden="true" :icon="refreshOutline" />
                Coba lagi
              </button>
            </section>

            <div class="error-information">
              <ion-icon aria-hidden="true" :icon="informationCircleOutline" />
              <div>
                <strong>Data tidak hilang</strong>
                <span>
                  Sistem hanya gagal memuat rekomendasi dan tidak mengubah
                  profil pengguna.
                </span>
              </div>
            </div>
          </template>
        </section>

        <footer class="states-note">
          <ion-icon aria-hidden="true" :icon="informationCircleOutline" />
          State ini disimulasikan untuk kebutuhan dokumentasi dan pengujian UI.
        </footer>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.states-page {
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.16), transparent 25%),
    var(--app-background);
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
  padding:
    calc(var(--app-space-4) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(var(--app-space-6) + env(safe-area-inset-bottom));
}

.states-header {
  align-items: center;
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 40px 1fr auto;
}

.states-header > button {
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

.states-header > button ion-icon {
  font-size: 1.05rem;
}

.states-header p {
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  margin: 0 0 2px;
  text-transform: uppercase;
}

.states-header h1 {
  color: var(--app-text);
  font-size: 1.4rem;
  font-weight: 850;
  letter-spacing: -0.04em;
  margin: 0;
}

.states-header > span {
  background: var(--app-primary-soft);
  border: 1px solid #c7e2d3;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 850;
  padding: 7px 9px;
}

.state-switcher {
  background: #e7eee9;
  border-radius: var(--app-radius-md);
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, 1fr);
  margin-top: var(--app-space-5);
  padding: 4px;
}

.state-switcher button {
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 12px;
  color: var(--app-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 0.66rem;
  font-weight: 800;
  min-height: 38px;
}

.state-switcher button.active {
  background: var(--app-surface);
  box-shadow: 0 3px 10px rgba(31, 74, 56, 0.08);
  color: var(--ion-color-primary);
}

.preview-frame {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-md);
  margin-top: var(--app-space-4);
  min-height: 610px;
  overflow: hidden;
  padding: var(--app-space-4);
}

.preview-header {
  align-items: center;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--app-space-3);
}

.preview-header p {
  color: var(--ion-color-primary);
  font-size: 0.56rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  margin: 0 0 3px;
  text-transform: uppercase;
}

.preview-header h2 {
  color: var(--app-text);
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  margin: 0;
}

.preview-header > span {
  color: var(--app-text-muted);
  font-size: 0.56rem;
  font-weight: 750;
}

.loading-state,
.central-state {
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: var(--app-space-6) var(--app-space-4) var(--app-space-4);
  text-align: center;
}

.state-icon {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 50%;
  color: var(--ion-color-primary);
  display: inline-flex;
  height: 66px;
  justify-content: center;
  width: 66px;
}

.state-icon ion-icon {
  font-size: 1.75rem;
}

.state-icon--loading {
  background: var(--ion-color-primary);
  color: #ffffff;
}

.state-icon--loading ion-spinner {
  --color: #ffffff;
  height: 28px;
  width: 28px;
}

.state-icon--error {
  background: #fde9e7;
  color: var(--ion-color-danger);
}

.loading-state > p,
.central-state > p {
  color: var(--ion-color-primary);
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  margin: var(--app-space-3) 0 4px;
  text-transform: uppercase;
}

.central-state--error > p {
  color: var(--ion-color-danger);
}

.loading-state h3,
.central-state h3 {
  color: var(--app-text);
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.035em;
  margin: 0;
}

.loading-state > span:last-child,
.central-state > span {
  color: var(--app-text-muted);
  font-size: 0.66rem;
  line-height: 1.55;
  margin-top: var(--app-space-2);
  max-width: 280px;
}

.central-state > button {
  align-items: center;
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.66rem;
  font-weight: 850;
  gap: 6px;
  justify-content: center;
  margin-top: var(--app-space-4);
  min-height: 44px;
  padding: 0 var(--app-space-5);
}

.central-state--error > button {
  background: var(--ion-color-danger);
}

.skeleton-summary {
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: 7px;
  padding: var(--app-space-3);
}

.skeleton {
  animation: pulse 1.4s ease-in-out infinite;
  background: linear-gradient(90deg, #dce7e0 25%, #eef3ef 50%, #dce7e0 75%);
  background-size: 200% 100%;
  border-radius: var(--app-radius-pill);
  display: block;
}

.skeleton--short {
  height: 7px;
  width: 30%;
}

.skeleton--title {
  height: 15px;
  width: 54%;
}

.skeleton--progress {
  height: 6px;
  width: 100%;
}

.skeleton-list {
  display: grid;
  gap: var(--app-space-2);
  margin-top: var(--app-space-3);
}

.skeleton-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 68px 1fr;
  padding: 7px;
}

.skeleton-card > span:last-child {
  display: grid;
  gap: 8px;
  padding: 5px 0;
}

.skeleton-card i {
  display: block;
}

.skeleton--image {
  border-radius: 11px;
  height: 58px;
  width: 68px;
}

.skeleton--line {
  height: 10px;
  width: 82%;
}

.skeleton--medium {
  height: 7px;
  width: 58%;
}

.state-details {
  background: var(--app-surface-soft);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-3);
  margin-top: var(--app-space-4);
  padding: var(--app-space-4);
}

.state-details div {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.64rem;
  gap: var(--app-space-2);
}

.state-details ion-icon {
  color: var(--ion-color-primary);
  font-size: 1rem;
}

.error-information {
  align-items: flex-start;
  background: #fff4f2;
  border: 1px solid #f2d0cc;
  border-radius: var(--app-radius-md);
  color: var(--ion-color-danger);
  display: flex;
  gap: var(--app-space-3);
  margin-top: var(--app-space-5);
  padding: var(--app-space-4);
}

.error-information > ion-icon {
  flex: 0 0 auto;
  font-size: 1rem;
}

.error-information div {
  display: grid;
}

.error-information strong {
  color: var(--app-text);
  font-size: 0.66rem;
}

.error-information span {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  line-height: 1.45;
  margin-top: 3px;
}

.states-note {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.56rem;
  gap: 6px;
  justify-content: center;
  line-height: 1.4;
  margin-top: var(--app-space-3);
  text-align: center;
}

.states-note ion-icon {
  color: var(--ion-color-primary);
  flex: 0 0 auto;
  font-size: 0.85rem;
}

@keyframes pulse {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
