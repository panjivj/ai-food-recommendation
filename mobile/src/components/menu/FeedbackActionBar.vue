<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  checkmarkCircle,
  checkmarkCircleOutline,
  thumbsDown,
  thumbsDownOutline,
  thumbsUp,
  thumbsUpOutline,
} from 'ionicons/icons'
import type {
  FeedbackAction,
  UserMenuFeedback,
} from '@/types/domain'

defineProps<{
  feedback: UserMenuFeedback | null
  loading: boolean
  saving: boolean
}>()

defineEmits<{
  feedback: [action: FeedbackAction]
}>()
</script>

<template>
  <div class="action-bar">
    <div class="action-bar__inner">
      <button
        class="feedback-button"
        :class="{ 'feedback-button--active': feedback?.liked }"
        type="button"
        aria-label="Suka menu ini"
        :aria-pressed="feedback?.liked ?? false"
        :disabled="loading || saving || !feedback"
        @click="$emit('feedback', 'like')"
      >
        <span>
          <ion-icon
            aria-hidden="true"
            :icon="feedback?.liked ? thumbsUp : thumbsUpOutline"
          />
        </span>
        Suka
      </button>

      <button
        class="feedback-button feedback-button--dislike"
        :class="{ 'feedback-button--active': feedback?.disliked }"
        type="button"
        aria-label="Tidak suka menu ini"
        :aria-pressed="feedback?.disliked ?? false"
        :disabled="loading || saving || !feedback"
        @click="$emit('feedback', 'dislike')"
      >
        <span>
          <ion-icon
            aria-hidden="true"
            :icon="feedback?.disliked ? thumbsDown : thumbsDownOutline"
          />
        </span>
        Tidak suka
      </button>

      <button
        class="feedback-button feedback-button--consumed"
        :class="{ 'feedback-button--active': feedback?.consumed }"
        type="button"
        aria-label="Tandai menu telah dikonsumsi"
        :aria-pressed="feedback?.consumed ?? false"
        :disabled="loading || saving || !feedback"
        @click="$emit('feedback', 'consumed')"
      >
        <span>
          <ion-icon
            aria-hidden="true"
            :icon="
              feedback?.consumed
                ? checkmarkCircle
                : checkmarkCircleOutline
            "
          />
        </span>
        Dikonsumsi
      </button>

      <div v-if="saving" class="saving-indicator" aria-live="polite">
        <ion-spinner name="crescent" />
        Menyimpan
      </div>
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
  align-items: center;
  display: grid;
  gap: 7px;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 auto;
  max-width: calc(var(--app-mobile-width) - (var(--app-space-4) * 2));
  position: relative;
}

.feedback-button {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--app-text-muted);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  font-size: 0.56rem;
  font-weight: 750;
  gap: 4px;
  justify-content: center;
  min-width: 0;
  padding: 0;
}

.feedback-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.feedback-button > span {
  align-items: center;
  background: var(--app-surface-soft);
  border: 1px solid transparent;
  border-radius: 12px;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  width: 42px;
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

.saving-indicator {
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--app-radius-pill);
  color: var(--app-text-muted);
  display: flex;
  font-size: 0.54rem;
  gap: 5px;
  left: 50%;
  padding: 5px 8px;
  position: absolute;
  top: -30px;
  transform: translateX(-50%);
}

.saving-indicator ion-spinner {
  height: 12px;
  width: 12px;
}
</style>
