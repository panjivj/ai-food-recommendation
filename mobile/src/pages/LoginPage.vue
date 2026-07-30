<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, IonToast } from '@ionic/vue'
import {
  arrowForward,
  checkmarkCircle,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import { userFacingApiError } from '@/services/api/client'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)
const errorMessage = ref('')
const toastOpen = ref(false)
const submitting = ref(false)

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Email dan kata sandi perlu diisi.'
    return
  }

  submitting.value = true

  try {
    await authStore.login(email.value, password.value, rememberMe.value)
    profileStore.reset()
    const profile = await profileStore.fetch()
    await router.replace(profile ? '/app/home' : '/profile/setup')
  } catch (error) {
    errorMessage.value = userFacingApiError(
      error,
      'Login gagal. Silakan coba kembali.',
    )
  } finally {
    submitting.value = false
  }
}

const showForgotPasswordInfo = () => {
  toastOpen.value = true
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="login-page">
        <div class="login-page__decoration login-page__decoration--one" />
        <div class="login-page__decoration login-page__decoration--two" />

        <header class="login-header">
          <a class="brand" href="/app/home" aria-label="NutriChoice">
            <span class="brand__mark" aria-hidden="true">N</span>
            <span>NutriChoice</span>
          </a>
          <span class="demo-badge">
            <span aria-hidden="true" />
            Terhubung API
          </span>
        </header>

        <section class="welcome-copy">
          <p>Rekomendasi sehatmu menanti</p>
          <h1>Selamat datang kembali!</h1>
          <span>
            Masuk untuk melihat menu harian yang telah disesuaikan dengan
            profilmu.
          </span>
        </section>

        <form class="login-card" novalidate @submit.prevent="handleSubmit">
          <div class="account-hint">
            <span>
              <ion-icon aria-hidden="true" :icon="checkmarkCircle" />
            </span>
            <div>
              <strong>Masuk dengan akunmu</strong>
              <small>Gunakan email dan kata sandi yang telah didaftarkan.</small>
            </div>
          </div>

          <label class="form-group">
            <span class="form-group__label">Alamat email</span>
            <span
              class="input-field"
              :class="{ 'input-field--error': errorMessage && !email.trim() }"
            >
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

          <label class="form-group">
            <span class="form-group__label">Kata sandi</span>
            <span
              class="input-field"
              :class="{
                'input-field--error': errorMessage && !password.trim(),
              }"
            >
              <ion-icon aria-hidden="true" :icon="lockClosedOutline" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Masukkan kata sandi"
                aria-label="Kata sandi"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-label="
                  showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                "
                @click="showPassword = !showPassword"
              >
                <ion-icon
                  aria-hidden="true"
                  :icon="showPassword ? eyeOffOutline : eyeOutline"
                />
              </button>
            </span>
          </label>

          <p v-if="errorMessage" class="form-error" role="alert">
            {{ errorMessage }}
          </p>

          <div class="form-options">
            <label class="remember-option">
              <input v-model="rememberMe" type="checkbox" />
              <span aria-hidden="true">
                <ion-icon :icon="checkmarkCircle" />
              </span>
              Ingat saya
            </label>
            <button type="button" @click="showForgotPasswordInfo">
              Lupa kata sandi?
            </button>
          </div>

          <button
            class="login-button"
            type="submit"
            :disabled="submitting"
          >
            {{ submitting ? 'Memverifikasi...' : 'Masuk' }}
            <ion-icon aria-hidden="true" :icon="arrowForward" />
          </button>

          <div class="security-note">
            <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
            <span>
              Kredensial diverifikasi oleh backend dan password tidak disimpan
              di aplikasi.
            </span>
          </div>
        </form>

        <footer class="register-prompt">
          <span>Belum memiliki akun?</span>
          <button type="button" @click="router.push('/register')">
            Daftar sekarang
          </button>
        </footer>
      </main>
    </ion-content>

    <ion-toast
      :is-open="toastOpen"
      message="Pemulihan kata sandi akan tersedia pada MVP terintegrasi."
      :duration="1800"
      position="top"
      color="dark"
      @did-dismiss="toastOpen = false"
    />
  </ion-page>
</template>

<style scoped>
.login-page {
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.18), transparent 26%),
    var(--app-background);
  margin: 0 auto;
  max-width: var(--app-mobile-width);
  min-height: 100%;
  overflow: hidden;
  padding:
    calc(var(--app-space-5) + env(safe-area-inset-top))
    var(--app-space-5)
    calc(var(--app-space-6) + env(safe-area-inset-bottom));
  position: relative;
}

.login-page__decoration {
  border: 1px solid rgba(33, 107, 78, 0.08);
  border-radius: 50%;
  pointer-events: none;
  position: absolute;
}

.login-page__decoration--one {
  height: 180px;
  right: -105px;
  top: 90px;
  width: 180px;
}

.login-page__decoration--two {
  bottom: 40px;
  height: 110px;
  left: -70px;
  width: 110px;
}

.login-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  position: relative;
}

.brand {
  align-items: center;
  color: var(--app-text);
  display: flex;
  font-size: 1rem;
  font-weight: 850;
  gap: var(--app-space-2);
  letter-spacing: -0.03em;
  text-decoration: none;
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

.demo-badge {
  align-items: center;
  background: var(--app-primary-soft);
  border: 1px solid #c7e2d3;
  border-radius: var(--app-radius-pill);
  color: var(--ion-color-primary);
  display: inline-flex;
  font-size: 0.65rem;
  font-weight: 800;
  gap: 6px;
  padding: 7px 9px;
}

.demo-badge > span {
  background: var(--ion-color-primary);
  border-radius: 50%;
  height: 6px;
  width: 6px;
}

.welcome-copy {
  padding: var(--app-space-10) 0 var(--app-space-6);
  position: relative;
}

.welcome-copy p {
  color: var(--ion-color-primary);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 7px;
  text-transform: uppercase;
}

.welcome-copy h1 {
  color: var(--app-text);
  font-size: 2rem;
  font-weight: 850;
  letter-spacing: -0.05em;
  line-height: 1.08;
  margin: 0;
}

.welcome-copy > span {
  color: var(--app-text-muted);
  display: block;
  font-size: 0.82rem;
  line-height: 1.55;
  margin-top: var(--app-space-3);
  max-width: 330px;
}

.login-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-md);
  padding: var(--app-space-5);
  position: relative;
}

.account-hint {
  align-items: center;
  background: var(--app-primary-soft);
  border: 1px solid #c9e4d6;
  border-radius: var(--app-radius-md);
  display: flex;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-5);
  padding: var(--app-space-3);
}

.account-hint > span {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 10px;
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
}

.account-hint ion-icon {
  font-size: 1rem;
}

.account-hint div {
  display: grid;
  gap: 2px;
}

.account-hint strong {
  color: var(--app-text);
  font-size: 0.72rem;
}

.account-hint small {
  color: var(--app-text-muted);
  font-size: 0.62rem;
}

.form-group {
  display: grid;
  gap: 7px;
  margin-top: var(--app-space-4);
}

.form-group__label {
  color: var(--app-text);
  font-size: 0.72rem;
  font-weight: 800;
}

.input-field {
  align-items: center;
  background: #fbfcfa;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  color: var(--app-text-muted);
  display: flex;
  gap: var(--app-space-2);
  min-height: 52px;
  padding: 0 var(--app-space-3);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.input-field:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(33, 107, 78, 0.1);
}

.input-field--error {
  border-color: var(--ion-color-danger);
}

.input-field > ion-icon {
  flex: 0 0 auto;
  font-size: 1rem;
}

.input-field input {
  background: transparent;
  border: 0;
  color: var(--app-text);
  flex: 1;
  font: inherit;
  font-size: 0.78rem;
  min-width: 0;
  outline: 0;
}

.input-field input::placeholder {
  color: #9aa39f;
}

.password-toggle {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--app-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  padding: 0;
  width: 36px;
}

.password-toggle ion-icon {
  font-size: 1rem;
}

.form-error {
  color: var(--ion-color-danger);
  font-size: 0.65rem;
  margin: var(--app-space-2) 0 0;
}

.form-options {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: var(--app-space-4) 0;
}

.remember-option {
  align-items: center;
  color: var(--app-text-muted);
  cursor: pointer;
  display: flex;
  font-size: 0.68rem;
  gap: 7px;
}

.remember-option input {
  height: 0;
  opacity: 0;
  position: absolute;
  width: 0;
}

.remember-option > span {
  align-items: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 7px;
  color: transparent;
  display: inline-flex;
  height: 21px;
  justify-content: center;
  width: 21px;
}

.remember-option input:checked + span {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
}

.remember-option ion-icon {
  font-size: 0.8rem;
}

.form-options > button,
.register-prompt button {
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

.login-button {
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
  font-size: 0.82rem;
  font-weight: 850;
  gap: var(--app-space-2);
  justify-content: center;
  min-height: 52px;
  width: 100%;
}

.login-button:active {
  background: var(--ion-color-primary-shade);
  transform: scale(0.99);
}

.login-button ion-icon {
  font-size: 1rem;
}

.security-note {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.58rem;
  gap: 7px;
  justify-content: center;
  line-height: 1.4;
  margin-top: var(--app-space-4);
  text-align: center;
}

.security-note ion-icon {
  color: var(--ion-color-primary);
  flex: 0 0 auto;
  font-size: 0.9rem;
}

.register-prompt {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.7rem;
  gap: 5px;
  justify-content: center;
  padding-top: var(--app-space-5);
  position: relative;
}

@media (max-height: 760px) {
  .welcome-copy {
    padding: var(--app-space-6) 0 var(--app-space-4);
  }

  .login-card {
    padding: var(--app-space-4);
  }

  .account-hint {
    margin-bottom: var(--app-space-3);
  }

  .form-group {
    margin-top: var(--app-space-3);
  }
}
</style>
