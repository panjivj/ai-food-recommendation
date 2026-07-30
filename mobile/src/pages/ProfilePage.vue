<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  alertCircleOutline,
  bodyOutline,
  chevronForward,
  fitnessOutline,
  heartOutline,
  leafOutline,
  pencilOutline,
  restaurantOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import { useDemoStore } from '@/stores/demo'
import type { DemoUser } from '@/types/domain'

const router = useRouter()
const demoStore = useDemoStore()

const initials = computed(() =>
  demoStore.user.name
    .split(' ')
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join(''),
)

const goalLabels: Record<DemoUser['goal'], string> = {
  maintain: 'Menjaga berat badan',
  weight_loss: 'Menurunkan berat badan',
  weight_gain: 'Menaikkan berat badan',
}

const activityLabels: Record<DemoUser['activityLevel'], string> = {
  low: 'Aktivitas ringan',
  moderate: 'Aktivitas sedang',
  high: 'Aktivitas tinggi',
}

const healthCondition = computed(
  () => demoStore.user.healthConditions.join(', ') || 'Tidak ada',
)
const allergies = computed(
  () => demoStore.user.allergies.join(', ') || 'Tidak ada',
)
const dislikedFoods = computed(
  () => demoStore.user.dislikedFoods.join(', ') || 'Tidak ada',
)
const foodPreferences = computed(
  () => demoStore.user.foodPreferences.join(', ') || 'Tidak ada',
)
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="profile-page">
        <header class="profile-header">
          <div>
            <p>Akun pengguna</p>
            <h1>Profil saya</h1>
          </div>
          <span class="profile-header__status">
            <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
            Tersimpan
          </span>
        </header>

        <section class="identity-card">
          <div class="identity-card__top">
            <div class="avatar" aria-hidden="true">{{ initials }}</div>
            <div class="identity">
              <span>Profil lengkap</span>
              <h2>{{ demoStore.user.name }}</h2>
              <p>{{ demoStore.user.email }}</p>
            </div>
            <button
              type="button"
              aria-label="Edit profil"
              @click="router.push('/profile/edit')"
            >
              <ion-icon aria-hidden="true" :icon="pencilOutline" />
              Edit
            </button>
          </div>

          <div class="profile-completeness">
            <div>
              <span>100%</span>
              <small>Siap untuk rekomendasi personal</small>
            </div>
            <div class="profile-completeness__track" aria-hidden="true">
              <span />
            </div>
          </div>

          <div class="body-metrics">
            <div>
              <strong>{{ demoStore.user.age }}</strong>
              <span>tahun</span>
            </div>
            <div>
              <strong>{{ demoStore.user.heightCm }}</strong>
              <span>cm</span>
            </div>
            <div>
              <strong>{{ demoStore.user.weightKg }}</strong>
              <span>kg</span>
            </div>
          </div>
        </section>

        <section class="profile-section" aria-labelledby="target-title">
          <div class="section-heading">
            <div>
              <p>Rekomendasi personal</p>
              <h2 id="target-title">Tujuan & aktivitas</h2>
            </div>
            <ion-icon aria-hidden="true" :icon="fitnessOutline" />
          </div>

          <div class="preference-summary">
            <article>
              <span class="summary-icon summary-icon--green">
                <ion-icon aria-hidden="true" :icon="bodyOutline" />
              </span>
              <div>
                <small>Tujuan utama</small>
                <strong>{{ goalLabels[demoStore.user.goal] }}</strong>
              </div>
            </article>
            <article>
              <span class="summary-icon summary-icon--amber">
                <ion-icon aria-hidden="true" :icon="fitnessOutline" />
              </span>
              <div>
                <small>Rutinitas</small>
                <strong>{{ activityLabels[demoStore.user.activityLevel] }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section class="profile-section" aria-labelledby="health-title">
          <div class="section-heading">
            <div>
              <p>Filter menu</p>
              <h2 id="health-title">Kesehatan & preferensi</h2>
            </div>
            <ion-icon aria-hidden="true" :icon="heartOutline" />
          </div>

          <div class="health-grid">
            <article>
              <span class="health-grid__icon">
                <ion-icon aria-hidden="true" :icon="heartOutline" />
              </span>
              <div>
                <small>Kondisi</small>
                <strong>{{ healthCondition }}</strong>
              </div>
              <span class="status-badge status-badge--safe">Aman</span>
            </article>

            <article>
              <span class="health-grid__icon health-grid__icon--warning">
                <ion-icon aria-hidden="true" :icon="alertCircleOutline" />
              </span>
              <div>
                <small>Alergi</small>
                <strong>{{ allergies }}</strong>
              </div>
              <span class="status-badge status-badge--warning">Dihindari</span>
            </article>

            <article>
              <span class="health-grid__icon health-grid__icon--neutral">
                <ion-icon aria-hidden="true" :icon="restaurantOutline" />
              </span>
              <div>
                <small>Tidak disukai</small>
                <strong>{{ dislikedFoods }}</strong>
              </div>
            </article>

            <article>
              <span class="health-grid__icon">
                <ion-icon aria-hidden="true" :icon="leafOutline" />
              </span>
              <div>
                <small>Preferensi</small>
                <strong>{{ foodPreferences }}</strong>
              </div>
            </article>
          </div>
        </section>

        <button
          class="edit-profile-button"
          type="button"
          @click="router.push('/profile/edit')"
        >
          <span>
            <ion-icon aria-hidden="true" :icon="pencilOutline" />
          </span>
          <span>
            <strong>Perbarui informasi profil</strong>
            <small>Sesuaikan data tubuh, tujuan, dan preferensi.</small>
          </span>
          <ion-icon aria-hidden="true" :icon="chevronForward" />
        </button>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.profile-page {
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  padding:
    calc(var(--app-space-5) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(var(--app-space-8) + env(safe-area-inset-bottom));
}

.profile-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.profile-header p,
.section-heading p {
  color: var(--ion-color-primary);
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  text-transform: uppercase;
}

.profile-header h1 {
  color: var(--app-text);
  font-size: 1.75rem;
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.1;
  margin: 0;
}

.profile-header__status {
  align-items: center;
  background: var(--app-primary-soft);
  border: 1px solid #c7e2d3;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  display: flex;
  font-size: 0.6rem;
  font-weight: 800;
  gap: 5px;
  padding: 7px 9px;
}

.profile-header__status ion-icon {
  font-size: 0.8rem;
}

.identity-card {
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.3), transparent 34%),
    linear-gradient(145deg, #216b4e 0%, #18583f 100%);
  border-radius: var(--app-radius-lg);
  box-shadow: 0 16px 32px rgba(33, 107, 78, 0.2);
  color: #ffffff;
  margin-top: var(--app-space-4);
  overflow: hidden;
  padding: var(--app-space-4);
}

.identity-card__top {
  align-items: center;
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 58px minmax(0, 1fr) auto;
}

.avatar {
  align-items: center;
  background: var(--app-accent-soft);
  border: 3px solid rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  color: #86520e;
  display: inline-flex;
  font-size: 1rem;
  font-weight: 900;
  height: 58px;
  justify-content: center;
  width: 58px;
}

.identity {
  min-width: 0;
}

.identity > span {
  color: #bfe7d3;
  font-size: 0.58rem;
  font-weight: 800;
}

.identity h2 {
  font-size: 1.05rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  margin: 3px 0;
}

.identity p {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.6rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-card__top > button {
  align-items: center;
  appearance: none;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--app-radius-pill);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.58rem;
  font-weight: 800;
  gap: 4px;
  padding: 7px 9px;
}

.profile-completeness {
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  margin-top: var(--app-space-4);
  padding-top: var(--app-space-3);
}

.profile-completeness > div:first-child {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.profile-completeness span {
  font-size: 0.65rem;
  font-weight: 850;
}

.profile-completeness small {
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.54rem;
}

.profile-completeness__track {
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--app-radius-pill);
  height: 5px;
  margin-top: 6px;
  overflow: hidden;
}

.profile-completeness__track span {
  background: #f4b860;
  border-radius: inherit;
  display: block;
  height: 100%;
  width: 100%;
}

.body-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: var(--app-space-3);
}

.body-metrics div {
  align-items: baseline;
  border-right: 1px solid rgba(255, 255, 255, 0.13);
  display: flex;
  gap: 4px;
  justify-content: center;
}

.body-metrics div:last-child {
  border-right: 0;
}

.body-metrics strong {
  font-size: 0.9rem;
}

.body-metrics span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.55rem;
}

.profile-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  margin-top: var(--app-space-3);
  padding: var(--app-space-4);
}

.section-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--app-space-3);
}

.section-heading h2 {
  color: var(--app-text);
  font-size: 0.92rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  margin: 0;
}

.section-heading > ion-icon {
  color: var(--ion-color-primary);
  font-size: 1.05rem;
}

.preference-summary {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.preference-summary article {
  align-items: center;
  background: var(--app-surface-soft);
  border-radius: var(--app-radius-md);
  display: flex;
  gap: var(--app-space-2);
  min-width: 0;
  padding: 9px;
}

.summary-icon {
  align-items: center;
  border-radius: 9px;
  display: inline-flex;
  flex: 0 0 30px;
  height: 30px;
  justify-content: center;
}

.summary-icon--green {
  background: var(--app-primary-soft);
  color: var(--ion-color-primary);
}

.summary-icon--amber {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

.summary-icon ion-icon {
  font-size: 0.85rem;
}

.preference-summary article div {
  display: grid;
  min-width: 0;
}

.preference-summary small,
.health-grid small {
  color: var(--app-text-muted);
  font-size: 0.52rem;
}

.preference-summary strong,
.health-grid strong {
  color: var(--app-text);
  font-size: 0.62rem;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.health-grid {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.health-grid article {
  align-items: center;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  display: grid;
  gap: 7px;
  grid-template-columns: 28px minmax(0, 1fr);
  min-width: 0;
  padding: 8px;
  position: relative;
}

.health-grid__icon {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 9px;
  color: var(--ion-color-primary);
  display: inline-flex;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.health-grid__icon--warning {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

.health-grid__icon--neutral {
  background: #edf0ee;
  color: var(--app-text-muted);
}

.health-grid__icon ion-icon {
  font-size: 0.8rem;
}

.health-grid article > div {
  display: grid;
  min-width: 0;
}

.status-badge {
  border-radius: var(--app-radius-pill);
  bottom: 5px;
  font-size: 0.45rem;
  font-weight: 850;
  padding: 3px 5px;
  position: absolute;
  right: 5px;
}

.status-badge--safe {
  background: var(--app-primary-soft);
  color: var(--ion-color-primary);
}

.status-badge--warning {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

.edit-profile-button {
  align-items: center;
  appearance: none;
  background: var(--app-primary-soft);
  border: 1px solid #c5e1d2;
  border-radius: var(--app-radius-md);
  color: var(--app-text);
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: var(--app-space-3);
  grid-template-columns: 34px minmax(0, 1fr) auto;
  margin-top: var(--app-space-3);
  padding: var(--app-space-3);
  text-align: left;
  width: 100%;
}

.edit-profile-button > span:first-child {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 10px;
  color: #ffffff;
  display: inline-flex;
  height: 34px;
  justify-content: center;
}

.edit-profile-button > span:nth-child(2) {
  display: grid;
}

.edit-profile-button strong {
  font-size: 0.66rem;
}

.edit-profile-button small {
  color: var(--app-text-muted);
  font-size: 0.54rem;
  margin-top: 3px;
}

.edit-profile-button > ion-icon {
  color: var(--ion-color-primary);
}

@media (max-height: 860px) {
  .profile-page {
    padding-top: calc(var(--app-space-4) + env(safe-area-inset-top));
  }

  .profile-header h1 {
    font-size: 1.55rem;
  }

  .identity-card {
    margin-top: var(--app-space-3);
    padding: var(--app-space-3);
  }

  .identity-card__top {
    grid-template-columns: 52px minmax(0, 1fr) auto;
  }

  .avatar {
    height: 52px;
    width: 52px;
  }

  .profile-completeness {
    margin-top: var(--app-space-3);
  }

  .profile-section {
    padding: var(--app-space-3);
  }
}
</style>
