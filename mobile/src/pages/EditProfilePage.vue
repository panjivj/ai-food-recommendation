<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  arrowBack,
  checkmark,
  fitnessOutline,
  heartOutline,
  mailOutline,
  personOutline,
  refreshOutline,
  saveOutline,
} from 'ionicons/icons'
import { useDemoStore } from '@/stores/demo'
import type { DemoUser } from '@/types/domain'

const router = useRouter()
const demoStore = useDemoStore()

const name = ref(demoStore.user.name)
const email = ref(demoStore.user.email)
const age = ref(demoStore.user.age)
const gender = ref<DemoUser['gender']>(demoStore.user.gender)
const heightCm = ref(demoStore.user.heightCm)
const weightKg = ref(demoStore.user.weightKg)
const activityLevel = ref<DemoUser['activityLevel']>(
  demoStore.user.activityLevel,
)
const goal = ref<DemoUser['goal']>(demoStore.user.goal)
const healthCondition = ref(
  demoStore.user.healthConditions[0] ?? 'Tidak ada',
)
const allergy = ref(demoStore.user.allergies[0] ?? 'Tidak ada')
const dislikedFood = ref(demoStore.user.dislikedFoods[0] ?? '')
const foodPreference = ref('Makanan rumahan')

const resetForm = () => {
  name.value = demoStore.user.name
  email.value = demoStore.user.email
  age.value = demoStore.user.age
  gender.value = demoStore.user.gender
  heightCm.value = demoStore.user.heightCm
  weightKg.value = demoStore.user.weightKg
  activityLevel.value = demoStore.user.activityLevel
  goal.value = demoStore.user.goal
  healthCondition.value =
    demoStore.user.healthConditions[0] ?? 'Tidak ada'
  allergy.value = demoStore.user.allergies[0] ?? 'Tidak ada'
  dislikedFood.value = demoStore.user.dislikedFoods[0] ?? ''
}

const saveProfile = () => {
  demoStore.user.name = name.value.trim()
  demoStore.user.email = email.value.trim()
  demoStore.user.age = age.value
  demoStore.user.gender = gender.value
  demoStore.user.heightCm = heightCm.value
  demoStore.user.weightKg = weightKg.value
  demoStore.user.activityLevel = activityLevel.value
  demoStore.user.goal = goal.value
  demoStore.user.healthConditions =
    healthCondition.value === 'Tidak ada' ? [] : [healthCondition.value]
  demoStore.user.allergies =
    allergy.value === 'Tidak ada' ? [] : [allergy.value]
  demoStore.user.dislikedFoods = dislikedFood.value.trim()
    ? [dislikedFood.value.trim()]
    : []

  router.replace('/app/profile')
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="edit-profile-page">
        <header class="edit-header">
          <button
            class="back-button"
            type="button"
            aria-label="Kembali ke profil"
            @click="router.push('/app/profile')"
          >
            <ion-icon aria-hidden="true" :icon="arrowBack" />
          </button>
          <div>
            <p>Pengaturan akun</p>
            <h1>Edit profil</h1>
          </div>
          <button class="reset-button" type="button" @click="resetForm">
            <ion-icon aria-hidden="true" :icon="refreshOutline" />
            Reset
          </button>
        </header>

        <div class="edit-note">
          <span>
            <ion-icon aria-hidden="true" :icon="checkmark" />
          </span>
          <div>
            <strong>Profilmu sudah lengkap</strong>
            <small>
              Perubahan data akan langsung digunakan pada simulasi rekomendasi.
            </small>
          </div>
        </div>

        <form class="edit-form" @submit.prevent="saveProfile">
          <section class="form-section">
            <div class="section-heading">
              <span>
                <ion-icon aria-hidden="true" :icon="personOutline" />
              </span>
              <div>
                <h2>Informasi akun</h2>
                <p>Identitas utama pengguna aplikasi.</p>
              </div>
            </div>

            <div class="account-grid">
              <label>
                <span>Nama lengkap</span>
                <span class="text-input">
                  <ion-icon aria-hidden="true" :icon="personOutline" />
                  <input v-model="name" type="text" aria-label="Nama lengkap" />
                </span>
              </label>
              <label>
                <span>Alamat email</span>
                <span class="text-input">
                  <ion-icon aria-hidden="true" :icon="mailOutline" />
                  <input v-model="email" type="email" aria-label="Alamat email" />
                </span>
              </label>
            </div>

            <div class="identity-row">
              <label>
                <span>Usia</span>
                <span class="number-input">
                  <input v-model.number="age" type="number" aria-label="Usia" />
                  <small>tahun</small>
                </span>
              </label>
              <fieldset>
                <legend>Jenis kelamin</legend>
                <div class="segmented-control">
                  <button
                    type="button"
                    :class="{ active: gender === 'female' }"
                    @click="gender = 'female'"
                  >
                    Perempuan
                  </button>
                  <button
                    type="button"
                    :class="{ active: gender === 'male' }"
                    @click="gender = 'male'"
                  >
                    Laki-laki
                  </button>
                </div>
              </fieldset>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading">
              <span class="section-heading__amber">
                <ion-icon aria-hidden="true" :icon="fitnessOutline" />
              </span>
              <div>
                <h2>Data tubuh & tujuan</h2>
                <p>Digunakan untuk menyesuaikan kebutuhan harian.</p>
              </div>
            </div>

            <div class="body-grid">
              <label>
                <span>Tinggi badan</span>
                <span class="number-input">
                  <input
                    v-model.number="heightCm"
                    type="number"
                    aria-label="Tinggi badan"
                  />
                  <small>cm</small>
                </span>
              </label>
              <label>
                <span>Berat badan</span>
                <span class="number-input">
                  <input
                    v-model.number="weightKg"
                    type="number"
                    aria-label="Berat badan"
                  />
                  <small>kg</small>
                </span>
              </label>
              <label>
                <span>Aktivitas</span>
                <select v-model="activityLevel">
                  <option value="low">Ringan</option>
                  <option value="moderate">Sedang</option>
                  <option value="high">Aktif</option>
                </select>
              </label>
              <label>
                <span>Tujuan</span>
                <select v-model="goal">
                  <option value="weight_loss">Turun berat</option>
                  <option value="maintain">Menjaga berat</option>
                  <option value="weight_gain">Naik berat</option>
                </select>
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading">
              <span>
                <ion-icon aria-hidden="true" :icon="heartOutline" />
              </span>
              <div>
                <h2>Kesehatan & preferensi</h2>
                <p>Batasan yang diterapkan pada pilihan menu.</p>
              </div>
            </div>

            <div class="health-grid">
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
              <label>
                <span>Makanan tidak disukai</span>
                <input
                  v-model="dislikedFood"
                  class="standalone-input"
                  type="text"
                  aria-label="Makanan tidak disukai"
                />
              </label>
              <label>
                <span>Preferensi makanan</span>
                <select v-model="foodPreference">
                  <option>Makanan rumahan</option>
                  <option>Tinggi protein</option>
                  <option>Vegetarian</option>
                </select>
              </label>
            </div>
          </section>

          <button class="save-button" type="submit">
            <ion-icon aria-hidden="true" :icon="saveOutline" />
            Simpan perubahan
          </button>

          <p class="local-note">
            Data hanya diperbarui pada state lokal untuk kebutuhan demo UI.
          </p>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.edit-profile-page {
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

.edit-header {
  align-items: center;
  display: grid;
  gap: var(--app-space-3);
  grid-template-columns: 40px 1fr auto;
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

.edit-header p {
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  margin: 0 0 2px;
  text-transform: uppercase;
}

.edit-header h1 {
  color: var(--app-text);
  font-size: 1.4rem;
  font-weight: 850;
  letter-spacing: -0.04em;
  margin: 0;
}

.reset-button {
  align-items: center;
  appearance: none;
  background: var(--app-primary-soft);
  border: 1px solid #c7e2d3;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.6rem;
  font-weight: 800;
  gap: 4px;
  padding: 7px 9px;
}

.edit-note {
  align-items: center;
  background: var(--app-primary-soft);
  border: 1px solid #c7e2d3;
  border-radius: var(--app-radius-md);
  display: flex;
  gap: var(--app-space-3);
  margin: var(--app-space-4) 0 var(--app-space-3);
  padding: var(--app-space-3);
}

.edit-note > span {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 9px;
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 30px;
  height: 30px;
  justify-content: center;
}

.edit-note ion-icon {
  font-size: 0.85rem;
}

.edit-note div {
  display: grid;
}

.edit-note strong {
  color: var(--app-text);
  font-size: 0.66rem;
}

.edit-note small {
  color: var(--app-text-muted);
  font-size: 0.54rem;
  margin-top: 2px;
}

.edit-form {
  display: grid;
  gap: var(--app-space-2);
}

.form-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
  padding: var(--app-space-3);
}

.section-heading {
  align-items: center;
  display: flex;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-3);
}

.section-heading > span {
  align-items: center;
  background: var(--app-primary-soft);
  border-radius: 10px;
  color: var(--ion-color-primary);
  display: inline-flex;
  flex: 0 0 32px;
  height: 32px;
  justify-content: center;
}

.section-heading > .section-heading__amber {
  background: var(--app-accent-soft);
  color: #9a5b09;
}

.section-heading ion-icon {
  font-size: 0.9rem;
}

.section-heading h2 {
  color: var(--app-text);
  font-size: 0.78rem;
  font-weight: 850;
  margin: 0;
}

.section-heading p {
  color: var(--app-text-muted);
  font-size: 0.52rem;
  margin: 2px 0 0;
}

.account-grid,
.body-grid,
.health-grid {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 5px;
  min-width: 0;
}

label > span:first-child,
legend {
  color: var(--app-text-muted);
  font-size: 0.55rem;
  font-weight: 750;
}

.text-input,
.number-input {
  align-items: center;
  background: #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  display: flex;
  min-height: 37px;
  padding: 0 9px;
}

.text-input:focus-within,
.number-input:focus-within {
  border-color: var(--ion-color-primary);
}

.text-input ion-icon {
  color: var(--app-text-muted);
  flex: 0 0 auto;
  font-size: 0.75rem;
  margin-right: 6px;
}

.text-input input,
.number-input input {
  appearance: textfield;
  background: transparent;
  border: 0;
  color: var(--app-text);
  font: inherit;
  font-size: 0.62rem;
  font-weight: 700;
  min-width: 0;
  outline: 0;
  width: 100%;
}

.number-input small {
  color: var(--app-text-muted);
  font-size: 0.48rem;
}

.identity-row {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: 90px 1fr;
  margin-top: var(--app-space-2);
}

.identity-row fieldset {
  border: 0;
  margin: 0;
  min-width: 0;
  padding: 0;
}

.identity-row legend {
  margin-bottom: 5px;
}

.segmented-control {
  background: var(--app-surface-soft);
  border-radius: 11px;
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(2, 1fr);
  padding: 3px;
}

.segmented-control button {
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--app-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 0.55rem;
  font-weight: 750;
  min-height: 31px;
}

.segmented-control button.active {
  background: var(--app-surface);
  box-shadow: 0 2px 8px rgba(31, 74, 56, 0.08);
  color: var(--ion-color-primary);
  font-weight: 850;
}

select,
.standalone-input {
  appearance: none;
  background:
    linear-gradient(45deg, transparent 50%, var(--app-text-muted) 50%)
      calc(100% - 12px) 50% / 4px 4px no-repeat,
    linear-gradient(135deg, var(--app-text-muted) 50%, transparent 50%)
      calc(100% - 8px) 50% / 4px 4px no-repeat,
    #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  color: var(--app-text);
  font: inherit;
  font-size: 0.58rem;
  font-weight: 700;
  min-height: 37px;
  outline: 0;
  padding: 0 22px 0 9px;
  width: 100%;
}

.standalone-input {
  background: #fbfcfa;
  padding-right: 9px;
}

select:focus,
.standalone-input:focus {
  border-color: var(--ion-color-primary);
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
  font-size: 0.72rem;
  font-weight: 850;
  gap: 7px;
  justify-content: center;
  min-height: 48px;
  width: 100%;
}

.save-button:active {
  background: var(--ion-color-primary-shade);
  transform: scale(0.99);
}

.local-note {
  color: var(--app-text-muted);
  font-size: 0.53rem;
  margin: -1px 0 0;
  text-align: center;
}

@media (max-height: 860px) {
  .edit-note {
    margin-bottom: var(--app-space-2);
    margin-top: var(--app-space-3);
  }

  .form-section {
    padding: 11px;
  }

  .section-heading {
    margin-bottom: var(--app-space-2);
  }

  .text-input,
  .number-input,
  select,
  .standalone-input {
    min-height: 34px;
  }

  .segmented-control button {
    min-height: 28px;
  }

  .save-button {
    min-height: 45px;
  }

  .local-note {
    display: none;
  }
}
</style>
