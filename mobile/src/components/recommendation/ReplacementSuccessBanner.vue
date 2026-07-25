<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { checkmarkCircle, close } from 'ionicons/icons'

defineProps<{
  previousMenuName: string
  newMenuName: string
  mealLabel: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <section class="success-banner" role="status" aria-live="polite">
    <span class="success-banner__icon">
      <ion-icon aria-hidden="true" :icon="checkmarkCircle" />
    </span>
    <div>
      <p>Menu berhasil diganti</p>
      <h2>{{ mealLabel }} kini menggunakan {{ newMenuName }}</h2>
      <small>
        <s>{{ previousMenuName }}</s>
        <span aria-hidden="true">→</span>
        <strong>{{ newMenuName }}</strong>
      </small>
    </div>
    <button type="button" aria-label="Tutup informasi" @click="$emit('close')">
      <ion-icon aria-hidden="true" :icon="close" />
    </button>
  </section>
</template>

<style scoped>
.success-banner {
  align-items: flex-start;
  background:
    radial-gradient(circle at 100% 0%, rgba(240, 168, 75, 0.18), transparent 38%),
    var(--app-primary-soft);
  border: 1px solid #b9ddca;
  border-radius: var(--app-radius-md);
  display: grid;
  gap: var(--app-space-2);
  grid-template-columns: 34px minmax(0, 1fr) 28px;
  margin-top: var(--app-space-3);
  padding: var(--app-space-3);
}

.success-banner__icon {
  align-items: center;
  background: var(--ion-color-primary);
  border-radius: 10px;
  color: #ffffff;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.success-banner__icon ion-icon {
  font-size: 1.05rem;
}

.success-banner p {
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  margin: 0 0 3px;
  text-transform: uppercase;
}

.success-banner h2 {
  color: var(--app-text);
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
}

.success-banner small {
  align-items: center;
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.52rem;
  gap: 5px;
  margin-top: 5px;
  min-width: 0;
}

.success-banner small s,
.success-banner small strong {
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.success-banner small strong {
  color: var(--ion-color-primary);
}

.success-banner > button {
  align-items: center;
  appearance: none;
  background: rgba(255, 255, 255, 0.68);
  border: 0;
  border-radius: 9px;
  color: var(--app-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 28px;
  justify-content: center;
  padding: 0;
  width: 28px;
}

.success-banner > button ion-icon {
  font-size: 0.85rem;
}
</style>
