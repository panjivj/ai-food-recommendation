<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  arrowBack,
  arrowForward,
  checkmark,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import { userFacingApiError } from '@/services/api/client'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const acceptedTerms = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const submitting = ref(false)

const handleSubmit = async () => {
  errorMessage.value = ''

  if (
    !name.value.trim() ||
    !email.value.trim() ||
    !password.value ||
    !passwordConfirmation.value
  ) {
    errorMessage.value = 'Semua informasi perlu dilengkapi.'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Konfirmasi kata sandi belum sesuai.'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Kata sandi minimal 8 karakter.'
    return
  }

  if (!acceptedTerms.value) {
    errorMessage.value = 'Setujui ketentuan penggunaan demo untuk melanjutkan.'
    return
  }

  submitting.value = true

  try {
    await authStore.register(name.value, email.value, password.value)
    profileStore.reset()
    await router.replace('/profile/setup')
  } catch (error) {
    errorMessage.value = userFacingApiError(
      error,
      'Registrasi gagal. Silakan coba kembali.',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="register-page">
        <div class="page-decoration page-decoration--one" />
        <div class="page-decoration page-decoration--two" />

        <header class="register-header">
          <button
            class="back-button"
            type="button"
            aria-label="Kembali ke halaman login"
            @click="router.push('/login')"
          >
            <ion-icon aria-hidden="true" :icon="arrowBack" />
          </button>

          <a class="brand" href="/app/home" aria-label="NutriChoice">
            <span class="brand__mark" aria-hidden="true">N</span>
            <span>NutriChoice</span>
          </a>

          <span class="step-badge">Langkah 1/2</span>
        </header>

        <section class="welcome-copy">
          <p>Mulai perjalanan sehatmu</p>
          <h1>Buat akun baru</h1>
          <span>
            Lengkapi akun demo untuk mendapatkan rekomendasi yang lebih
            personal.
          </span>
        </section>

        <form class="register-card" novalidate @submit.prevent="handleSubmit">
          <label class="form-group">
            <span class="form-group__label">Nama lengkap</span>
            <span class="input-field">
              <ion-icon aria-hidden="true" :icon="personOutline" />
              <input
                v-model="name"
                type="text"
                autocomplete="name"
                placeholder="Masukkan nama lengkap"
                aria-label="Nama lengkap"
              />
            </span>
          </label>

          <label class="form-group">
            <span class="form-group__label">Alamat email</span>
            <span class="input-field">
              <ion-icon aria-hidden="true" :icon="mailOutline" />
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="nama@email.com"
                aria-label="Alamat email"
              />
            </span>
          </label>

          <div class="password-grid">
            <label class="form-group">
              <span class="form-group__label">Kata sandi</span>
              <span class="input-field">
                <ion-icon aria-hidden="true" :icon="lockClosedOutline" />
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Min. 8 karakter"
                  aria-label="Kata sandi"
                />
              </span>
            </label>

            <label class="form-group">
              <span class="form-group__label">Konfirmasi</span>
              <span class="input-field">
                <ion-icon aria-hidden="true" :icon="lockClosedOutline" />
                <input
                  v-model="passwordConfirmation"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Ulangi sandi"
                  aria-label="Konfirmasi kata sandi"
                />
              </span>
            </label>
          </div>

          <button
            class="password-visibility"
            type="button"
            @click="showPassword = !showPassword"
          >
            <ion-icon
              aria-hidden="true"
              :icon="showPassword ? eyeOffOutline : eyeOutline"
            />
            {{ showPassword ? 'Sembunyikan' : 'Tampilkan' }} kata sandi
          </button>

          <label class="terms-option">
            <input v-model="acceptedTerms" type="checkbox" />
            <span class="terms-option__box" aria-hidden="true">
              <ion-icon :icon="checkmark" />
            </span>
            <span>
              Saya menyetujui <strong>Ketentuan Penggunaan</strong> dan memahami
              bahwa aplikasi ini tidak memberikan diagnosis medis.
            </span>
          </label>

          <p v-if="errorMessage" class="form-error" role="alert">
            {{ errorMessage }}
          </p>

          <button
            class="register-button"
            type="submit"
            :disabled="submitting"
          >
            {{ submitting ? 'Membuat akun...' : 'Buat akun' }}
            <ion-icon aria-hidden="true" :icon="arrowForward" />
          </button>

          <div class="security-note">
            <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
            <span>Password dilindungi dan dikirim ke backend melalui API.</span>
          </div>
        </form>

        <footer class="login-prompt">
          <span>Sudah memiliki akun?</span>
          <button type="button" @click="router.push('/login')">
            Masuk di sini
          </button>
        </footer>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.register-page {
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.18), transparent 27%),
    var(--app-background);
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
  overflow: hidden;
  padding:
    calc(var(--app-space-4) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(var(--app-space-5) + env(safe-area-inset-bottom));
  position: relative;
}

.page-decoration {
  border: 1px solid rgba(33, 107, 78, 0.08);
  border-radius: 50%;
  pointer-events: none;
  position: absolute;
}

.page-decoration--one {
  height: 180px;
  right: -110px;
  top: 105px;
  width: 180px;
}

.page-decoration--two {
  bottom: 20px;
  height: 100px;
  left: -65px;
  width: 100px;
}

.register-header {
  align-items: center;
  display: grid;
  grid-template-columns: 42px 1fr auto;
  position: relative;
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

.welcome-copy {
  padding: var(--app-space-6) 0 var(--app-space-4);
  position: relative;
}

.welcome-copy p {
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 5px;
  text-transform: uppercase;
}

.welcome-copy h1 {
  color: var(--app-text);
  font-size: 1.8rem;
  font-weight: 850;
  letter-spacing: -0.05em;
  line-height: 1.08;
  margin: 0;
}

.welcome-copy > span {
  color: var(--app-text-muted);
  display: block;
  font-size: 0.76rem;
  line-height: 1.5;
  margin-top: 7px;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-md);
  padding: var(--app-space-5);
  position: relative;
}

.form-group {
  display: grid;
  gap: 6px;
  margin-bottom: var(--app-space-3);
  min-width: 0;
}

.form-group__label {
  color: var(--app-text);
  font-size: 0.68rem;
  font-weight: 800;
}

.input-field {
  align-items: center;
  background: #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  color: var(--app-text-muted);
  display: flex;
  gap: 7px;
  min-height: 47px;
  padding: 0 11px;
}

.input-field:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(33, 107, 78, 0.1);
}

.input-field ion-icon {
  flex: 0 0 auto;
  font-size: 0.92rem;
}

.input-field input {
  background: transparent;
  border: 0;
  color: var(--app-text);
  flex: 1;
  font: inherit;
  font-size: 0.7rem;
  min-width: 0;
  outline: 0;
}

.input-field input::placeholder {
  color: #9aa39f;
}

.password-grid {
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.password-visibility {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--ion-color-primary);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.62rem;
  font-weight: 800;
  gap: 5px;
  margin: -4px 0 var(--app-space-4) auto;
  padding: 0;
}

.password-visibility ion-icon {
  font-size: 0.85rem;
}

.terms-option {
  align-items: flex-start;
  color: var(--app-text-muted);
  cursor: pointer;
  display: flex;
  font-size: 0.59rem;
  gap: var(--app-space-2);
  line-height: 1.45;
}

.terms-option input {
  height: 0;
  opacity: 0;
  position: absolute;
  width: 0;
}

.terms-option__box {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 7px;
  color: transparent;
  display: inline-flex;
  flex: 0 0 21px;
  height: 21px;
  justify-content: center;
}

.terms-option input:checked + .terms-option__box {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
}

.terms-option ion-icon {
  font-size: 0.8rem;
}

.terms-option strong {
  color: var(--ion-color-primary);
}

.form-error {
  color: var(--ion-color-danger);
  font-size: 0.62rem;
  margin: var(--app-space-2) 0 0;
}

.register-button {
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
  font-size: 0.78rem;
  font-weight: 850;
  gap: var(--app-space-2);
  justify-content: center;
  margin-top: var(--app-space-4);
  min-height: 49px;
  width: 100%;
}

.register-button:active {
  background: var(--ion-color-primary-shade);
  transform: scale(0.99);
}

.security-note {
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

.security-note ion-icon {
  color: var(--ion-color-primary);
  flex: 0 0 auto;
  font-size: 0.85rem;
}

.login-prompt {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.68rem;
  gap: 5px;
  justify-content: center;
  padding-top: var(--app-space-4);
  position: relative;
}

.login-prompt button {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--ion-color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 4px 0;
}

@media (max-height: 760px) {
  .welcome-copy {
    padding: var(--app-space-4) 0 var(--app-space-3);
  }

  .register-card {
    padding: var(--app-space-4);
  }
}
</style>
