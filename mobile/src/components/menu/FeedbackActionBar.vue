<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  checkmarkCircle,
  checkmarkCircleOutline,
  repeatOutline,
  thumbsDown,
  thumbsDownOutline,
  thumbsUp,
  thumbsUpOutline,
} from 'ionicons/icons'
import type { FeedbackAction } from '@/types/domain'

defineProps<{
  activeFeedback: FeedbackAction | null
}>()

defineEmits<{
  feedback: [action: FeedbackAction]
  replace: []
}>()
</script>

<template>
  <div class="action-bar">
    <div class="action-bar__inner">
      <button
        class="feedback-button"
        :class="{ 'feedback-button--active': activeFeedback === 'like' }"
        type="button"
        aria-label="Suka menu ini"
        :aria-pressed="activeFeedback === 'like'"
        @click="$emit('feedback', 'like')"
      >
        <span>
          <ion-icon
            aria-hidden="true"
            :icon="activeFeedback === 'like' ? thumbsUp : thumbsUpOutline"
          />
        </span>
        Suka
      </button>

      <button
        class="feedback-button feedback-button--dislike"
        :class="{ 'feedback-button--active': activeFeedback === 'dislike' }"
        type="button"
        aria-label="Tidak suka menu ini"
        :aria-pressed="activeFeedback === 'dislike'"
        @click="$emit('feedback', 'dislike')"
      >
        <span>
          <ion-icon
            aria-hidden="true"
            :icon="activeFeedback === 'dislike' ? thumbsDown : thumbsDownOutline"
          />
        </span>
        Tidak suka
      </button>

      <button
        class="feedback-button feedback-button--consumed"
        :class="{ 'feedback-button--active': activeFeedback === 'consumed' }"
        type="button"
        aria-label="Tandai menu telah dikonsumsi"
        :aria-pressed="activeFeedback === 'consumed'"
        @click="$emit('feedback', 'consumed')"
      >
        <span>
          <ion-icon
            aria-hidden="true"
            :icon="
              activeFeedback === 'consumed'
                ? checkmarkCircle
                : checkmarkCircleOutline
            "
          />
        </span>
        Dikonsumsi
      </button>

      <button class="replace-button" type="button" @click="$emit('replace')">
        <ion-icon aria-hidden="true" :icon="repeatOutline" />
        Ganti menu
      </button>
    </div>
  </div>
</template>

<style scoped>
.action-bar {
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid var(--app-border);
  box-shadow: 0 -10px 30px rgba(31, 74, 56, 0.09);
  padding: var(--app-space-2) var(--app-space-4)
    calc(var(--app-space-2) + env(safe-area-inset-bottom));
}

.action-bar__inner {
  align-items: stretch;
  display: grid;
  gap: 7px;
  grid-template-columns: 48px 54px 58px minmax(116px, 1fr);
  margin: 0 auto;
  max-width: calc(var(--app-mobile-width) - (var(--app-space-4) * 2));
}

button {
  appearance: none;
  cursor: pointer;
  font-family: inherit;
}

.feedback-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--app-text-muted);
  display: flex;
  flex-direction: column;
  font-size: 0.55rem;
  font-weight: 750;
  gap: 4px;
  justify-content: center;
  min-width: 0;
  padding: 0;
}

.feedback-button > span {
  align-items: center;
  background: var(--app-surface-soft);
  border: 1px solid transparent;
  border-radius: 12px;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.feedback-button ion-icon {
  font-size: 1.1rem;
}

.feedback-button--active {
  color: var(--ion-color-primary);
}

.feedback-button--active > span {
  background: var(--app-primary-soft);
  border-color: #b8dcc9;
}

.feedback-button--dislike.feedback-button--active {
  color: var(--ion-color-danger);
}

.feedback-button--dislike.feedback-button--active > span {
  background: #fde9e7;
  border-color: #f3c4c0;
}

.feedback-button--consumed.feedback-button--active {
  color: #9a5b09;
}

.feedback-button--consumed.feedback-button--active > span {
  background: var(--app-accent-soft);
  border-color: #f4d7aa;
}

.replace-button {
  align-items: center;
  background: var(--ion-color-primary);
  border: 0;
  border-radius: var(--app-radius-md);
  color: #ffffff;
  display: flex;
  font-size: 0.75rem;
  font-weight: 850;
  gap: 7px;
  justify-content: center;
  min-height: 52px;
  padding: 0 var(--app-space-3);
}

.replace-button:active {
  background: var(--ion-color-primary-shade);
  transform: scale(0.98);
}

.replace-button ion-icon {
  font-size: 1rem;
}
</style>
