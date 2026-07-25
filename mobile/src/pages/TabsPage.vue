<script setup lang="ts">
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import { home, person, restaurant } from 'ionicons/icons'
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom" class="app-tab-bar">
        <ion-tab-button tab="home" href="/app/home">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Beranda</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="recommendations" href="/app/recommendations">
          <ion-icon aria-hidden="true" :icon="restaurant" />
          <ion-label>Rekomendasi</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/app/profile">
          <ion-icon aria-hidden="true" :icon="person" />
          <ion-label>Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<style scoped>
.app-tab-bar {
  --background: rgba(255, 255, 255, 0.98);
  --border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg) var(--app-radius-lg) 0 0;
  box-shadow: 0 -8px 24px rgba(31, 74, 56, 0.08);
  height: calc(70px + env(safe-area-inset-bottom));
  padding: var(--app-space-2) var(--app-space-2) env(safe-area-inset-bottom);
}

ion-tab-button {
  --color: #78827d;
  --color-selected: var(--ion-color-primary);
  --padding-bottom: 2px;
  --padding-top: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

ion-tab-button::part(native) {
  border-radius: var(--app-radius-md);
}

ion-tab-button.tab-selected::part(native) {
  background: var(--app-primary-soft);
}

ion-icon {
  font-size: 1.3rem;
  margin-bottom: 3px;
}
</style>
