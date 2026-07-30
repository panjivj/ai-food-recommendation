<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  arrowBack,
  arrowForward,
  checkmark,
  fitnessOutline,
  heartOutline,
  leafOutline,
  personOutline,
} from 'ionicons/icons'
import { useDemoStore } from '@/stores/demo'
import { userFacingApiError } from '@/services/api/client'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import type { DemoUser } from '@/types/domain'

const router = useRouter()
const demoStore = useDemoStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const name = ref(
  authStore.pendingProfileName ??
    authStore.user?.email.split('@')[0] ??
    demoStore.user.name,
)
const age = ref(demoStore.user.age)
const gender = ref<DemoUser['gender']>(demoStore.user.gender)
const heightCm = ref(demoStore.user.heightCm)
const weightKg = ref(demoStore.user.weightKg)
const activityLevel = ref<DemoUser['activityLevel']>(
  demoStore.user.activityLevel,
)
const goal = ref<DemoUser['goal']>(demoStore.user.goal)
const healthCondition = ref('Tidak ada')
const allergy = ref(demoStore.user.allergies[0] ?? 'Tidak ada')
const foodPreference = ref('Makanan rumahan')
const errorMessage = ref('')
const saving = ref(false)

const saveProfile = async () => {
  errorMessage.value = ''
  saving.value = true

  try {
    await profileStore.create({
      name: name.value,
      age: age.value,
      gender: gender.value,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      activityLevel: activityLevel.value,
      goal: goal.value,
      healthConditions:
        healthCondition.value === 'Tidak ada' ? [] : [healthCondition.value],
      allergies: allergy.value === 'Tidak ada' ? [] : [allergy.value],
      dislikedFoods: [],
      foodPreferences: [foodPreference.value],
    })
    await authStore.clearPendingProfileName()
    await router.replace('/app/home')
  } catch (error) {
    errorMessage.value = userFacingApiError(
      error,
      'Profil gagal disimpan. Silakan periksa kembali datanya.',
    )
  } finally {
    saving.value = false
  }
}

const cancelSetup = async () => {
  await authStore.logout()
  profileStore.reset()
  await router.replace('/register')
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="profile-setup">
        <header class="setup-header">
          <button
            class="back-button"
            type="button"
            aria-label="Kembali ke halaman registrasi"
            @click="cancelSetup"
          >
            <ion-icon aria-hidden="true" :icon="arrowBack" />
          </button>

          <a class="brand" href="/app/home" aria-label="NutriChoice">
            <span class="brand__mark" aria-hidden="true">N</span>
            <span>NutriChoice</span>
          </a>

          <span class="step-badge">Langkah 2/2</span>
        </header>

        <section class="setup-intro">
          <div class="progress-track" aria-label="Langkah 2 dari 2">
            <span />
          </div>
          <p>Personalisasi rekomendasi</p>
          <h1>Kenali kebutuhanmu</h1>
          <span>
            Data berikut membantu kami menampilkan simulasi menu yang lebih
            relevan.
          </span>
        </section>

        <form class="setup-form" @submit.prevent="saveProfile">
          <section class="form-section">
            <div class="section-title">
              <span>
                <ion-icon aria-hidden="true" :icon="personOutline" />
              </span>
              <div>
                <h2>Data tubuh</h2>
                <p>Informasi dasar untuk estimasi kebutuhan.</p>
              </div>
            </div>

            <label class="profile-name-field">
              <span>Nama lengkap</span>
              <input
                v-model="name"
                type="text"
                autocomplete="name"
                minlength="2"
                maxlength="100"
                aria-label="Nama lengkap"
                required
              />
            </label>

            <div class="metrics-grid">
              <label>
                <span>Usia</span>
                <span class="metric-input">
                  <input v-model.number="age" type="number" aria-label="Usia" />
                  <small>tahun</small>
                </span>
              </label>
              <label>
                <span>Tinggi</span>
                <span class="metric-input">
                  <input
                    v-model.number="heightCm"
                    type="number"
                    step="0.1"
                    aria-label="Tinggi badan"
                  />
                  <small>cm</small>
                </span>
              </label>
              <label>
                <span>Berat</span>
                <span class="metric-input">
                  <input
                    v-model.number="weightKg"
                    type="number"
                    step="0.1"
                    aria-label="Berat badan"
                  />
                  <small>kg</small>
                </span>
              </label>
            </div>

            <fieldset class="choice-group">
              <legend>Jenis kelamin</legend>
              <div class="segmented-control">
                <button
                  type="button"
                  :class="{ active: gender === 'female' }"
                  @click="gender = 'female'"
                >
                  <ion-icon
                    v-if="gender === 'female'"
                    aria-hidden="true"
                    :icon="checkmark"
                  />
                  Perempuan
                </button>
                <button
                  type="button"
                  :class="{ active: gender === 'male' }"
                  @click="gender = 'male'"
                >
                  <ion-icon
                    v-if="gender === 'male'"
                    aria-hidden="true"
                    :icon="checkmark"
                  />
                  Laki-laki
                </button>
              </div>
            </fieldset>
          </section>

          <section class="form-section">
            <div class="section-title">
              <span class="section-title__amber">
                <ion-icon aria-hidden="true" :icon="fitnessOutline" />
              </span>
              <div>
                <h2>Aktivitas & tujuan</h2>
                <p>Sesuaikan dengan rutinitas harianmu.</p>
              </div>
            </div>

            <fieldset class="choice-group">
              <legend>Tingkat aktivitas</legend>
              <div class="option-pills option-pills--three">
                <button
                  type="button"
                  :class="{ active: activityLevel === 'low' }"
                  @click="activityLevel = 'low'"
                >
                  Ringan
                </button>
                <button
                  type="button"
                  :class="{ active: activityLevel === 'moderate' }"
                  @click="activityLevel = 'moderate'"
                >
                  Sedang
                </button>
                <button
                  type="button"
                  :class="{ active: activityLevel === 'high' }"
                  @click="activityLevel = 'high'"
                >
                  Aktif
                </button>
              </div>
            </fieldset>

            <fieldset class="choice-group">
              <legend>Tujuan utama</legend>
              <div class="option-pills option-pills--three">
                <button
                  type="button"
                  :class="{ active: goal === 'weight_loss' }"
                  @click="goal = 'weight_loss'"
                >
                  Turun
                </button>
                <button
                  type="button"
                  :class="{ active: goal === 'maintain' }"
                  @click="goal = 'maintain'"
                >
                  Menjaga
                </button>
                <button
                  type="button"
                  :class="{ active: goal === 'weight_gain' }"
                  @click="goal = 'weight_gain'"
                >
                  Naik
                </button>
              </div>
            </fieldset>
          </section>

          <section class="form-section">
            <div class="section-title">
              <span>
                <ion-icon aria-hidden="true" :icon="heartOutline" />
              </span>
              <div>
                <h2>Kesehatan & preferensi</h2>
                <p>Batasan penting dalam pemilihan menu.</p>
              </div>
            </div>

            <div class="select-grid">
              <label>
                <span>Kondisi kesehatan</span>
                <select v-model="healthCondition">
                  <option>Tidak ada</option>
                  <option>Hipertensi</option>
                  <option>Diabetes</option>
                </select>
              </label>
              <label>
                <span>Alergi</span>
                <select v-model="allergy">
                  <option>Tidak ada</option>
                  <option>Kacang tanah</option>
                  <option>Susu</option>
                  <option>Seafood</option>
                </select>
              </label>
            </div>

            <label class="preference-field">
              <span>
                <ion-icon aria-hidden="true" :icon="leafOutline" />
                Preferensi makanan
              </span>
              <select v-model="foodPreference">
                <option>Makanan rumahan</option>
                <option>Tinggi protein</option>
                <option>Vegetarian</option>
              </select>
            </label>
          </section>

          <p v-if="errorMessage" class="form-error" role="alert">
            {{ errorMessage }}
          </p>

          <button class="save-button" type="submit" :disabled="saving">
            {{ saving ? 'Menyimpan profil...' : 'Simpan & lihat rekomendasi' }}
            <ion-icon aria-hidden="true" :icon="arrowForward" />
          </button>

          <p class="privacy-note">
            Data profil disimpan pada akun dan digunakan untuk personalisasi.
          </p>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.profile-setup {
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.17), transparent 24%),
    var(--app-background);
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
  padding:
    calc(var(--app-space-4) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(var(--app-space-6) + env(safe-area-inset-bottom));
}

.setup-header {
  align-items: center;
  display: grid;
  grid-template-columns: 42px 1fr auto;
}

.back-button {
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

.back-button ion-icon {
  font-size: 1.05rem;
}

.brand {
  align-items: center;
  color: var(--app-text);
  display: flex;
  font-size: 0.92rem;
  font-weight: 850;
  gap: 7px;
  justify-self: center;
  letter-spacing: -0.03em;
  text-decoration: none;
}

.brand__mark {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 10px 10px 10px 4px;
  color: #ffffff;
  display: inline-flex;
  font-size: 0.72rem;
  height: 29px;
  justify-content: center;
  width: 29px;
}

.step-badge {
  background: var(--app-primary-soft);
  border: 1px solid #c7e2d3;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  font-size: 0.6rem;
  font-weight: 800;
  padding: 7px 9px;
}

.setup-intro {
  padding: var(--app-space-5) 0 var(--app-space-4);
}

.progress-track {
  background: #dfe8e2;
  border-radius: var(--app-radius-pill);
  height: 5px;
  margin-bottom: var(--app-space-4);
  overflow: hidden;
}

.progress-track span {
  background: linear-gradient(90deg, var(--ion-color-primary), #5a977b);
  border-radius: inherit;
  display: block;
  height: 100%;
  width: 100%;
}

.setup-intro > p {
  color: var(--ion-color-primary);
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 5px;
  text-transform: uppercase;
}

.setup-intro h1 {
  color: var(--app-text);
  font-size: 1.75rem;
  font-weight: 850;
  letter-spacing: -0.05em;
  line-height: 1.08;
  margin: 0;
}

.setup-intro > span {
  color: var(--app-text-muted);
  display: block;
  font-size: 0.74rem;
  line-height: 1.5;
  margin-top: 6px;
}

.setup-form {
  display: grid;
  gap: var(--app-space-3);
}

.form-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  padding: var(--app-space-4);
}

.section-title {
  align-items: center;
  display: flex;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-3);
}

.section-title > span {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 11px;
  color: var(--ion-color-primary);
  display: inline-flex;
  flex: 0 0 36px;
  height: 36px;
  justify-content: center;
}

.section-title > .section-title__amber {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

.section-title ion-icon {
  font-size: 1rem;
}

.section-title h2 {
  color: var(--app-text);
  font-size: 0.86rem;
  font-weight: 850;
  margin: 0;
}

.section-title p {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  margin: 3px 0 0;
}

.metrics-grid {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(3, 1fr);
}

.profile-name-field {
  display: grid;
  gap: 5px;
  margin-bottom: var(--app-space-3);
}

.profile-name-field span {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  font-weight: 750;
}

.profile-name-field input {
  background: #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  color: var(--app-text);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 750;
  min-height: 40px;
  outline: 0;
  padding: 0 10px;
  width: 100%;
}

.profile-name-field input:focus {
  border-color: var(--ion-color-primary);
}

.metrics-grid > label,
.select-grid > label {
  display: grid;
  gap: 5px;
}

.metrics-grid > label > span:first-child,
.select-grid label > span {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  font-weight: 750;
}

.metric-input {
  align-items: center;
  background: #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  display: flex;
  min-height: 40px;
  padding: 0 9px;
}

.metric-input:focus-within {
  border-color: var(--ion-color-primary);
}

.metric-input input {
  appearance: textfield;
  background: transparent;
  border: 0;
  color: var(--app-text);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  min-width: 0;
  outline: 0;
  width: 100%;
}

.metric-input small {
  color: var(--app-text-muted);
  font-size: 0.52rem;
}

.choice-group {
  border: 0;
  margin: var(--app-space-3) 0 0;
  min-width: 0;
  padding: 0;
}

.choice-group legend {
  color: var(--app-text-muted);
  font-size: 0.58rem;
  font-weight: 750;
  margin-bottom: 6px;
}

.segmented-control,
.option-pills {
  background: var(--app-surface-soft);
  border-radius: 12px;
  display: grid;
  gap: 4px;
  padding: 4px;
}

.segmented-control {
  grid-template-columns: repeat(2, 1fr);
}

.option-pills--three {
  grid-template-columns: repeat(3, 1fr);
}

.segmented-control button,
.option-pills button {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 9px;
  color: var(--app-text-muted);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.6rem;
  font-weight: 750;
  gap: 4px;
  justify-content: center;
  min-height: 31px;
}

.segmented-control button.active,
.option-pills button.active {
  background: var(--app-surface);
  box-shadow: 0 3px 10px rgba(31, 74, 56, 0.08);
  color: var(--ion-color-primary);
  font-weight: 850;
}

.segmented-control ion-icon {
  font-size: 0.72rem;
}

.select-grid {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.select-grid select,
.preference-field select {
  appearance: none;
  background:
    linear-gradient(45deg, transparent 50%, var(--app-text-muted) 50%)
      calc(100% - 12px) 50% / 4px 4px no-repeat,
    linear-gradient(135deg, var(--app-text-muted) 50%, transparent 50%)
      calc(100% - 8px) 50% / 4px 4px no-repeat,
    #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  color: var(--app-text);
  font: inherit;
  font-size: 0.62rem;
  font-weight: 700;
  min-height: 40px;
  outline: 0;
  padding: 0 22px 0 9px;
  width: 100%;
}

.preference-field {
  align-items: center;
  background: var(--app-primary-soft);
  border: 1px solid #c9e3d6;
  border-radius: 12px;
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 1fr 132px;
  margin-top: var(--app-space-3);
  padding: 7px 8px 7px 10px;
}

.preference-field > span {
  align-items: center;
  color: var(--ion-color-primary);
  display: flex;
  font-size: 0.58rem;
  font-weight: 800;
  gap: 5px;
}

.preference-field ion-icon {
  font-size: 0.85rem;
}

.preference-field select {
  background-color: var(--app-surface);
  min-height: 35px;
}

.save-button {
  align-items: center;
  appearance: none;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  box-shadow: 0 10px 22px rgba(33, 107, 78, 0.2);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 850;
  gap: var(--app-space-2);
  justify-content: center;
  min-height: 50px;
  width: 100%;
}

.save-button:active {
  background: var(--ion-color-primary-shade);
  transform: scale(0.99);
}

.save-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.form-error {
  color: var(--ion-color-danger);
  font-size: 0.66rem;
  line-height: 1.45;
  margin: 0;
  text-align: center;
}

.privacy-note {
  color: var(--app-text-muted);
  font-size: 0.56rem;
  margin: -3px 0 0;
  text-align: center;
}

@media (max-height: 860px) {
  .setup-intro {
    padding: var(--app-space-3) 0 var(--app-space-3);
  }

  .progress-track {
    margin-bottom: var(--app-space-3);
  }

  .setup-intro h1 {
    font-size: 1.55rem;
  }

  .setup-intro > span {
    font-size: 0.68rem;
  }

  .setup-form {
    gap: var(--app-space-2);
  }

  .form-section {
    padding: var(--app-space-3);
  }

  .section-title {
    margin-bottom: var(--app-space-2);
  }

  .section-title > span {
    flex-basis: 32px;
    height: 32px;
  }

  .metric-input,
  .select-grid select {
    min-height: 36px;
  }

  .choice-group {
    margin-top: var(--app-space-2);
  }

  .segmented-control button,
  .option-pills button {
    min-height: 27px;
  }

  .preference-field {
    margin-top: var(--app-space-2);
    padding-bottom: 5px;
    padding-top: 5px;
  }

  .preference-field select {
    min-height: 32px;
  }

  .save-button {
    min-height: 46px;
  }

  .privacy-note {
    display: none;
  }
}
</style>
